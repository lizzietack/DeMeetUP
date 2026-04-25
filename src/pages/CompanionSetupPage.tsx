import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { transcodeToJpeg } from "@/platform/media";
import {
  ArrowRight, ArrowLeft, Camera, X, Plus, Check,
  DollarSign, Clock, Moon, Package, CalendarDays
} from "lucide-react";

const SERVICE_OPTIONS = [
  "Girlfriend Experience", "Hookup", "Sensual Massage", "Nuru Massage",
  "Happy Ending Massage", "Body-to-Body Massage", "Tantric Massage",
  "Overnight Stay", "Dinner Date", "Travel Companion", "Party Partner",
  "Striptease", "Role Play", "Couples Experience", "BDSM",
  "Weekend Getaway", "Outcall", "Incall", "Video Call",
];

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const TIME_SLOTS = ["Morning", "Afternoon", "Evening", "Night"];

type CustomPackage = { name: string; price: string; description: string };

const CompanionSetupPage = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Step 1: Images
  const [images, setImages] = useState<{ file: File; preview: string }[]>([]);

  // Step 2: Services
  const [selectedServices, setSelectedServices] = useState<string[]>([]);

  // Step 3: Pricing
  const [hourlyRate, setHourlyRate] = useState("");
  const [overnightRate, setOvernightRate] = useState("");
  const [customPackages, setCustomPackages] = useState<CustomPackage[]>([]);

  // Step 4: Availability
  const [availability, setAvailability] = useState<Record<string, string[]>>({});

  // Step 5: Bio & Details
  const [gender, setGender] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState(profile?.location || "");
  const [phone, setPhone] = useState((profile as any)?.phone || "");

  const steps = [
    { title: "Photos", subtitle: "Upload your best shots" },
    { title: "Services", subtitle: "What do you offer?" },
    { title: "Pricing", subtitle: "Set your rates" },
    { title: "Availability", subtitle: "When are you free?" },
    { title: "About You", subtitle: "Final details" },
  ];

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (images.length + files.length > 8) {
      toast({ title: "Max 8 images", variant: "destructive" });
      return;
    }
    try {
      // Convert HEIC/webp/avif/etc. to JPEG so all browsers can render them.
      const converted = await Promise.all(files.map((f) => transcodeToJpeg(f)));
      const newImages = converted.map((file) => ({
        file,
        preview: URL.createObjectURL(file),
      }));
      setImages((prev) => [...prev, ...newImages]);
    } catch (err: any) {
      toast({
        title: "Image conversion failed",
        description: err?.message || "Try a different photo",
        variant: "destructive",
      });
    } finally {
      // Reset so the same file can be re-picked after an error.
      if (e.target) e.target.value = "";
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => {
      URL.revokeObjectURL(prev[index].preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const toggleService = (service: string) => {
    setSelectedServices((prev) =>
      prev.includes(service) ? prev.filter((s) => s !== service) : [...prev, service]
    );
  };

  const toggleAvailability = (day: string, slot: string) => {
    setAvailability((prev) => {
      const daySlots = prev[day] || [];
      const updated = daySlots.includes(slot)
        ? daySlots.filter((s) => s !== slot)
        : [...daySlots, slot];
      return { ...prev, [day]: updated };
    });
  };

  const addPackage = () => {
    setCustomPackages((prev) => [...prev, { name: "", price: "", description: "" }]);
  };

  const updatePackage = (index: number, field: keyof CustomPackage, value: string) => {
    setCustomPackages((prev) =>
      prev.map((pkg, i) => (i === index ? { ...pkg, [field]: value } : pkg))
    );
  };

  const removePackage = (index: number) => {
    setCustomPackages((prev) => prev.filter((_, i) => i !== index));
  };

  const canProceed = () => {
    switch (step) {
      case 0: return images.length >= 1;
      case 1: return selectedServices.length >= 1;
      case 2: return hourlyRate !== "";
      case 3: return Object.values(availability).some((s) => s.length > 0);
      case 4: return gender !== "" && bio.length >= 10;
      default: return true;
    }
  };

  const handleSubmit = async () => {
    if (!user) return;
    setIsSubmitting(true);

    try {
      // 1. Create companion profile
      const { data: companionProfile, error: profileError } = await supabase
        .from("companion_profiles")
        .insert({
          user_id: user.id,
          hourly_rate: parseFloat(hourlyRate) || null,
          overnight_rate: overnightRate ? parseFloat(overnightRate) : null,
          custom_packages: customPackages.filter((p) => p.name && p.price),
          services: selectedServices,
          gender,
          availability,
        })
        .select()
        .single();

      if (profileError) throw profileError;

      // 2. Update user profile with bio & location
      await supabase
        .from("profiles")
        .update({ bio, location, phone: phone.trim() || null })
        .eq("user_id", user.id);

      // 3. Upload images
      for (let i = 0; i < images.length; i++) {
        const img = images[i];
        const ext = img.file.name.split(".").pop();
        const path = `${user.id}/${companionProfile.id}_${i}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from("companion-images")
          .upload(path, img.file, { upsert: true });

        if (uploadError) {
          console.error("Upload error:", uploadError);
          continue;
        }

        const { data: urlData } = supabase.storage
          .from("companion-images")
          .getPublicUrl(path);

        await supabase.from("companion_images").insert({
          companion_profile_id: companionProfile.id,
          image_url: urlData.publicUrl,
          position: i,
        });

        // Also create a moderation record so admins can review/approve
        await supabase.from("image_moderation").insert({
          user_id: user.id,
          image_url: urlData.publicUrl,
          image_type: i === 0 ? "profile" : "gallery",
          status: "pending_review" as any,
        });
      }

      toast({ title: "Profile created!", description: "Your companion profile is live." });
      navigate("/dashboard");
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col px-4 py-8 max-w-lg mx-auto">
      <div className="absolute inset-0 bg-gradient-to-b from-purple-glow/10 via-transparent to-transparent pointer-events-none" />

      {/* Progress */}
      <div className="flex gap-1.5 mb-8 relative">
        {steps.map((_, i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors ${
              i <= step ? "gradient-gold" : "bg-secondary"
            }`}
          />
        ))}
      </div>

      {/* Header */}
      <motion.div
        key={step}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="mb-6 relative"
      >
        <p className="text-gold text-sm font-medium">Step {step + 1} of {steps.length}</p>
        <h1 className="font-display text-2xl font-bold text-foreground">{steps[step].title}</h1>
        <p className="text-muted-foreground text-sm">{steps[step].subtitle}</p>
      </motion.div>

      {/* Content */}
      <div className="flex-1 relative">
        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div key="photos" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.heic,.heif,.webp,.avif"
                multiple
                hidden
                onChange={handleImageUpload}
              />
              <div className="grid grid-cols-3 gap-3">
                {images.map((img, i) => (
                  <div key={i} className="relative aspect-[3/4] rounded-xl overflow-hidden group">
                    <img src={img.preview} alt="" className="w-full h-full object-cover" />
                    <button
                      onClick={() => removeImage(i)}
                      className="absolute top-1.5 right-1.5 w-7 h-7 bg-destructive rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-4 h-4 text-destructive-foreground" />
                    </button>
                    {i === 0 && (
                      <span className="absolute bottom-1.5 left-1.5 text-[10px] bg-primary text-primary-foreground px-2 py-0.5 rounded-full font-medium">
                        Main
                      </span>
                    )}
                  </div>
                ))}
                {images.length < 8 && (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="aspect-[3/4] rounded-xl border-2 border-dashed border-border hover:border-gold/50 flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-gold transition-colors"
                  >
                    <Camera className="w-6 h-6" />
                    <span className="text-xs">Add Photo</span>
                  </button>
                )}
              </div>
              <p className="text-muted-foreground text-xs mt-3 text-center">
                Upload 1–8 photos. First photo will be your main profile image.
              </p>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div key="services" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="flex flex-wrap gap-2">
                {SERVICE_OPTIONS.map((service) => (
                  <button
                    key={service}
                    onClick={() => toggleService(service)}
                    className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      selectedServices.includes(service)
                        ? "gradient-gold text-primary-foreground glow-gold"
                        : "glass hover:border-gold/30"
                    }`}
                  >
                    {selectedServices.includes(service) && <Check className="w-3.5 h-3.5 inline mr-1.5" />}
                    {service}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="pricing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              <div className="glass rounded-xl p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg gradient-gold flex items-center justify-center">
                    <Clock className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <div>
                    <p className="font-display font-semibold text-foreground">Hourly Rate</p>
                    <p className="text-muted-foreground text-xs">Per hour charge</p>
                  </div>
                </div>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="number"
                    placeholder="150"
                    value={hourlyRate}
                    onChange={(e) => setHourlyRate(e.target.value)}
                    className="w-full bg-secondary rounded-xl pl-9 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-gold/50"
                  />
                </div>
              </div>

              <div className="glass rounded-xl p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg gradient-purple flex items-center justify-center">
                    <Moon className="w-5 h-5 text-accent-foreground" />
                  </div>
                  <div>
                    <p className="font-display font-semibold text-foreground">Overnight Rate</p>
                    <p className="text-muted-foreground text-xs">Optional</p>
                  </div>
                </div>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="number"
                    placeholder="500"
                    value={overnightRate}
                    onChange={(e) => setOvernightRate(e.target.value)}
                    className="w-full bg-secondary rounded-xl pl-9 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-gold/50"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-gold" />
                    <p className="font-display font-semibold text-foreground text-sm">Custom Packages</p>
                  </div>
                  <button onClick={addPackage} className="text-gold text-sm flex items-center gap-1 hover:underline">
                    <Plus className="w-3.5 h-3.5" /> Add
                  </button>
                </div>
                <div className="space-y-3">
                  {customPackages.map((pkg, i) => (
                    <div key={i} className="glass rounded-xl p-3 space-y-2">
                      <div className="flex justify-between items-center">
                        <input
                          placeholder="Package name"
                          value={pkg.name}
                          onChange={(e) => updatePackage(i, "name", e.target.value)}
                          className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none flex-1"
                        />
                        <button onClick={() => removePackage(i)} className="text-muted-foreground hover:text-destructive ml-2">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                          <input
                            type="number"
                            placeholder="Price"
                            value={pkg.price}
                            onChange={(e) => updatePackage(i, "price", e.target.value)}
                            className="w-full bg-secondary rounded-lg pl-7 pr-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-gold/50"
                          />
                        </div>
                      </div>
                      <input
                        placeholder="Brief description"
                        value={pkg.description}
                        onChange={(e) => updatePackage(i, "description", e.target.value)}
                        className="w-full bg-secondary rounded-lg px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-gold/50"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="availability" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="flex items-center gap-2 mb-4">
                <CalendarDays className="w-4 h-4 text-gold" />
                <p className="text-muted-foreground text-sm">Tap to toggle your available times</p>
              </div>
              <div className="glass rounded-xl p-4 overflow-x-auto">
                <div className="grid grid-cols-[auto_repeat(7,1fr)] gap-1.5 min-w-[400px]">
                  <div />
                  {DAYS.map((day) => (
                    <div key={day} className="text-center text-xs font-medium text-muted-foreground py-1">
                      {day}
                    </div>
                  ))}
                  {TIME_SLOTS.map((slot) => (
                    <>
                      <div key={`label-${slot}`} className="text-xs text-muted-foreground pr-2 flex items-center">
                        {slot}
                      </div>
                      {DAYS.map((day) => {
                        const active = availability[day]?.includes(slot);
                        return (
                          <button
                            key={`${day}-${slot}`}
                            onClick={() => toggleAvailability(day, slot)}
                            className={`aspect-square rounded-lg text-[10px] transition-all ${
                              active
                                ? "gradient-gold text-primary-foreground glow-gold"
                                : "bg-secondary hover:bg-secondary/80 text-muted-foreground"
                            }`}
                          />
                        );
                      })}
                    </>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div key="about" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground mb-1.5 block">Gender</label>
                <div className="flex gap-2">
                  {["Female", "Male", "Non-binary", "Other"].map((g) => (
                    <button
                      key={g}
                      onClick={() => setGender(g.toLowerCase())}
                      className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all flex-1 ${
                        gender === g.toLowerCase()
                          ? "gradient-gold text-primary-foreground"
                          : "glass"
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm text-muted-foreground mb-1.5 block">Location</label>
                <input
                  type="text"
                  placeholder="e.g. New York, NY"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full bg-secondary rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-gold/50"
                />
              </div>

              <div>
                <label className="text-sm text-muted-foreground mb-1.5 block">
                  Phone Number <span className="text-gold">(for SMS booking alerts)</span>
                </label>
                <input
                  type="tel"
                  inputMode="tel"
                  placeholder="e.g. 0241234567 or +233241234567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  maxLength={20}
                  className="w-full bg-secondary rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-gold/50"
                />
                <p className="text-muted-foreground text-xs mt-1">
                  We'll text you when a guest books you. Optional but recommended.
                </p>
              </div>

              <div>
                <label className="text-sm text-muted-foreground mb-1.5 block">Bio</label>
                <textarea
                  placeholder="Write a captivating bio that will attract guests..."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={5}
                  className="w-full bg-secondary rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-gold/50 resize-none"
                />
                <p className="text-muted-foreground text-xs mt-1">{bio.length} characters (min 10)</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="flex gap-3 mt-8 relative">
        {step > 0 && (
          <button
            onClick={() => setStep(step - 1)}
            className="flex-1 glass rounded-xl py-3.5 font-display font-semibold text-foreground flex items-center justify-center gap-2 hover:bg-secondary/80 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
        )}
        {step < steps.length - 1 ? (
          <button
            onClick={() => setStep(step + 1)}
            disabled={!canProceed()}
            className="flex-1 gradient-gold text-primary-foreground font-display font-semibold py-3.5 rounded-xl hover:opacity-90 transition-all glow-gold disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            Next <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={!canProceed() || isSubmitting}
            className="flex-1 gradient-gold text-primary-foreground font-display font-semibold py-3.5 rounded-xl hover:opacity-90 transition-all glow-gold disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? "Creating Profile..." : <>Launch Profile <Check className="w-4 h-4" /></>}
          </button>
        )}
      </div>
    </div>
  );
};

export default CompanionSetupPage;
