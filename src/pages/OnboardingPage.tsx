import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useUploadAndModerate } from "@/hooks/use-image-moderation";
import { useToast } from "@/hooks/use-toast";
import ImageStatusBadge from "@/components/ImageStatusBadge";
import {
  ArrowRight, ArrowLeft, Camera, X, Plus, Check,
  DollarSign, Clock, Moon, Package, User, MapPin,
  Calendar, FileText, Image, Eye, Loader2, Globe
} from "lucide-react";
import { COUNTRIES, getCountryCurrency } from "@/data/countries";

const SERVICE_OPTIONS = [
  "Dinner Date", "Travel Companion", "Party Partner", "Social Events",
  "City Tour", "Fitness Partner", "Concert Buddy", "Art Gallery",
  "Wine Tasting", "Weekend Getaway", "Business Event", "Photography",
];

type GalleryImage = {
  imageUrl: string;
  moderationId: string;
  status: string;
  file?: File;
  preview?: string;
  rejectionReason?: string | null;
};

const OnboardingPage = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const uploadAndModerate = useUploadAndModerate();
  const profileFileRef = useRef<HTMLInputElement>(null);
  const galleryFileRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Step 1: Basic Info
  const [profileImage, setProfileImage] = useState<{
    file?: File;
    preview?: string;
    url?: string;
    moderationStatus?: string;
    moderationId?: string;
    rejectionReason?: string | null;
  } | null>(null);
  const [profileImageUploading, setProfileImageUploading] = useState(false);
  const [displayName, setDisplayName] = useState(profile?.display_name || "");
  const [gender, setGender] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [country, setCountry] = useState("");
  const [location, setLocation] = useState(profile?.location || "");

  const selectedCurrency = getCountryCurrency(country);
  const currencySymbol = selectedCurrency?.currencySymbol || "$";

  // Step 2: Bio
  const [bio, setBio] = useState(profile?.bio || "");

  // Step 3: Role Setup
  const [role, setRole] = useState<"guest" | "companion">(
    (profile?.role as "guest" | "companion") || "guest"
  );
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [hourlyRate, setHourlyRate] = useState("");
  const [overnightRate, setOvernightRate] = useState("");
  const [customPackages, setCustomPackages] = useState<{ name: string; price: string; description: string }[]>([]);

  // Step 4: Gallery
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [galleryUploading, setGalleryUploading] = useState(false);

  const isCompanion = role === "companion";

  const steps = isCompanion
    ? [
        { title: "Basic Info", subtitle: "Tell us about yourself", icon: User },
        { title: "Bio", subtitle: "Write your description", icon: FileText },
        { title: "Services & Pricing", subtitle: "What do you offer?", icon: DollarSign },
        { title: "Gallery", subtitle: "Upload your photos", icon: Image },
        { title: "Review", subtitle: "Check everything", icon: Eye },
      ]
    : [
        { title: "Basic Info", subtitle: "Tell us about yourself", icon: User },
        { title: "Bio", subtitle: "Write your description", icon: FileText },
        { title: "Preferences", subtitle: "What are you looking for?", icon: Eye },
        { title: "Review", subtitle: "Check everything", icon: Check },
      ];

  const totalSteps = steps.length;

  // Age check
  const getAge = useCallback((dob: string) => {
    if (!dob) return 0;
    const today = new Date();
    const birth = new Date(dob);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  }, []);

  const handleProfileImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const preview = URL.createObjectURL(file);
    setProfileImage({ file, preview });
    setProfileImageUploading(true);

    try {
      const result = await uploadAndModerate.mutateAsync({
        file,
        imageType: "profile",
      });
      setProfileImage({
        file,
        preview,
        url: result.imageUrl,
        moderationStatus: result.status,
        moderationId: result.moderationId,
        rejectionReason: result.rejectionReason,
      });
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
      setProfileImage(null);
    } finally {
      setProfileImageUploading(false);
    }
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (galleryImages.length + files.length > 8) {
      toast({ title: "Maximum 8 gallery images", variant: "destructive" });
      return;
    }

    setGalleryUploading(true);
    for (const file of files) {
      try {
        const preview = URL.createObjectURL(file);
        const result = await uploadAndModerate.mutateAsync({
          file,
          imageType: "gallery",
        });
        setGalleryImages((prev) => [
          ...prev,
          {
            imageUrl: result.imageUrl,
            moderationId: result.moderationId,
            status: result.status,
            file,
            preview,
            rejectionReason: result.rejectionReason,
          },
        ]);
      } catch (err: any) {
        toast({ title: "Upload failed", description: err.message, variant: "destructive" });
      }
    }
    setGalleryUploading(false);
  };

  const removeGalleryImage = (index: number) => {
    setGalleryImages((prev) => {
      if (prev[index].preview) URL.revokeObjectURL(prev[index].preview!);
      return prev.filter((_, i) => i !== index);
    });
  };

  const canProceed = () => {
    switch (step) {
      case 0: {
        const age = getAge(dateOfBirth);
        return (
          profileImage?.url &&
          profileImage.moderationStatus !== "rejected" &&
          displayName.trim().length >= 2 &&
          gender !== "" &&
          age >= 18 &&
          location.trim().length >= 2
        );
      }
      case 1:
        return bio.trim().length >= 10;
      case 2:
        if (isCompanion) {
          return selectedServices.length >= 1 && hourlyRate !== "";
        }
        return true; // guests have optional preferences
      case 3:
        if (isCompanion) {
          return galleryImages.length >= 1;
        }
        return true;
      default:
        return true;
    }
  };

  const handleSubmit = async () => {
    if (!user) return;
    setIsSubmitting(true);

    try {
      // Update profile
      const profileUpdate: any = {
        display_name: displayName.trim(),
        bio: bio.trim(),
        location: location.trim(),
        role,
        date_of_birth: dateOfBirth || null,
        avatar_url: profileImage?.url || null,
        profile_completed: true,
      };

      const { error: profileError } = await supabase
        .from("profiles")
        .update(profileUpdate)
        .eq("user_id", user.id);

      if (profileError) throw profileError;

      // If companion, create companion profile
      if (isCompanion) {
        // Check if companion profile already exists
        const { data: existing } = await supabase
          .from("companion_profiles")
          .select("id")
          .eq("user_id", user.id)
          .maybeSingle();

        if (existing) {
          await supabase
            .from("companion_profiles")
            .update({
              hourly_rate: parseFloat(hourlyRate) || null,
              overnight_rate: overnightRate ? parseFloat(overnightRate) : null,
              custom_packages: customPackages.filter((p) => p.name && p.price),
              services: selectedServices,
              gender,
            })
            .eq("user_id", user.id);
        } else {
          const { data: companionProfile, error: cpError } = await supabase
            .from("companion_profiles")
            .insert({
              user_id: user.id,
              hourly_rate: parseFloat(hourlyRate) || null,
              overnight_rate: overnightRate ? parseFloat(overnightRate) : null,
              custom_packages: customPackages.filter((p) => p.name && p.price),
              services: selectedServices,
              gender,
            })
            .select()
            .single();

          if (cpError) throw cpError;

          // Link gallery images to companion profile
          for (let i = 0; i < galleryImages.length; i++) {
            const img = galleryImages[i];
            if (img.status !== "rejected") {
              await supabase.from("companion_images").insert({
                companion_profile_id: companionProfile.id,
                image_url: img.imageUrl,
                position: i,
              });
            }
          }
        }
      }

      toast({ title: "Profile complete! 🎉", description: "Welcome to the platform." });
      navigate("/discover", { replace: true });
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
      <div className="flex gap-1.5 mb-6 relative">
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
        <p className="text-gold text-sm font-medium">Step {step + 1} of {totalSteps}</p>
        <h1 className="font-display text-2xl font-bold text-foreground">{steps[step].title}</h1>
        <p className="text-muted-foreground text-sm">{steps[step].subtitle}</p>
      </motion.div>

      {/* Content */}
      <div className="flex-1 relative overflow-y-auto">
        <AnimatePresence mode="wait">
          {/* Step 0: Basic Info */}
          {step === 0 && (
            <motion.div key="basic" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              {/* Profile Photo */}
              <div className="flex flex-col items-center gap-3">
                <input ref={profileFileRef} type="file" accept="image/*" hidden onChange={handleProfileImageUpload} />
                <button
                  onClick={() => profileFileRef.current?.click()}
                  disabled={profileImageUploading}
                  className="relative w-28 h-28 rounded-full border-2 border-dashed border-border hover:border-gold/50 overflow-hidden transition-colors group"
                >
                  {profileImage?.preview ? (
                    <img src={profileImage.preview} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground group-hover:text-gold transition-colors">
                      <Camera className="w-6 h-6" />
                      <span className="text-[10px] mt-1">Add Photo</span>
                    </div>
                  )}
                  {profileImageUploading && (
                    <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
                      <Loader2 className="w-6 h-6 text-gold animate-spin" />
                    </div>
                  )}
                </button>
                {profileImage?.moderationStatus && (
                  <ImageStatusBadge
                    status={profileImage.moderationStatus}
                    rejectionReason={profileImage.rejectionReason}
                  />
                )}
                {profileImage?.moderationStatus === "rejected" && (
                  <p className="text-xs text-destructive text-center">
                    {profileImage.rejectionReason || "Image rejected. Please upload another."}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">Profile photo (required)</p>
              </div>

              {/* Display Name */}
              <div>
                <label className="text-sm text-muted-foreground mb-1.5 block">Display Name</label>
                <input
                  type="text"
                  placeholder="Your name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  maxLength={50}
                  className="w-full bg-secondary rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-gold/50"
                />
              </div>

              {/* Gender */}
              <div>
                <label className="text-sm text-muted-foreground mb-1.5 block">Gender</label>
                <div className="flex gap-2 flex-wrap">
                  {["Female", "Male", "Non-binary", "Other"].map((g) => (
                    <button
                      key={g}
                      onClick={() => setGender(g.toLowerCase())}
                      className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                        gender === g.toLowerCase()
                          ? "gradient-gold text-primary-foreground"
                          : "glass hover:border-gold/30"
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              {/* Date of Birth */}
              <div>
                <label className="text-sm text-muted-foreground mb-1.5 block">Date of Birth</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="date"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split("T")[0]}
                    className="w-full bg-secondary rounded-xl pl-10 pr-4 py-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-gold/50"
                  />
                </div>
                {dateOfBirth && getAge(dateOfBirth) < 18 && (
                  <p className="text-xs text-destructive mt-1">You must be 18 or older to use this platform.</p>
                )}
              </div>

              {/* Country */}
              <div>
                <label className="text-sm text-muted-foreground mb-1.5 block">Country</label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <select
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full bg-secondary rounded-xl pl-10 pr-4 py-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-gold/50 appearance-none"
                  >
                    <option value="">Select your country</option>
                    {COUNTRIES.map((c) => (
                      <option key={c.code} value={c.country}>
                        {c.country}
                      </option>
                    ))}
                  </select>
                </div>
                {country && selectedCurrency && (
                  <p className="text-xs text-gold mt-1">
                    Currency: {selectedCurrency.currency} ({selectedCurrency.currencySymbol})
                  </p>
                )}
              </div>

              {/* Location */}
              <div>
                <label className="text-sm text-muted-foreground mb-1.5 block">City / Region</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="e.g. Accra, Lagos, Cape Town"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    maxLength={100}
                    className="w-full bg-secondary rounded-xl pl-10 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-gold/50"
                  />
                </div>
              </div>

              {/* Role Selection */}
              <div>
                <label className="text-sm text-muted-foreground mb-1.5 block">I want to be a...</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setRole("guest")}
                    className={`p-4 rounded-xl text-center transition-all ${
                      role === "guest" ? "gradient-gold text-primary-foreground" : "glass hover:border-gold/30"
                    }`}
                  >
                    <User className="w-6 h-6 mx-auto mb-1" />
                    <p className="text-sm font-semibold">Guest</p>
                    <p className="text-[10px] opacity-80">Browse & book</p>
                  </button>
                  <button
                    onClick={() => setRole("companion")}
                    className={`p-4 rounded-xl text-center transition-all ${
                      role === "companion" ? "gradient-gold text-primary-foreground" : "glass hover:border-gold/30"
                    }`}
                  >
                    <Camera className="w-6 h-6 mx-auto mb-1" />
                    <p className="text-sm font-semibold">Companion</p>
                    <p className="text-[10px] opacity-80">Offer services</p>
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 1: Bio */}
          {step === 1 && (
            <motion.div key="bio" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground mb-1.5 block">About You</label>
                <textarea
                  placeholder="Write a short description about yourself..."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  maxLength={500}
                  rows={6}
                  className="w-full bg-secondary rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-gold/50 resize-none"
                />
                <p className="text-xs text-muted-foreground text-right mt-1">{bio.length}/500</p>
              </div>
            </motion.div>
          )}

          {/* Step 2: Role Setup */}
          {step === 2 && isCompanion && (
            <motion.div key="companion-setup" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-5">
              {/* Services */}
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">Services you offer</label>
                <div className="flex flex-wrap gap-2">
                  {SERVICE_OPTIONS.map((service) => (
                    <button
                      key={service}
                      onClick={() =>
                        setSelectedServices((prev) =>
                          prev.includes(service) ? prev.filter((s) => s !== service) : [...prev, service]
                        )
                      }
                      className={`px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                        selectedServices.includes(service)
                          ? "gradient-gold text-primary-foreground"
                          : "glass hover:border-gold/30"
                      }`}
                    >
                      {selectedServices.includes(service) && <Check className="w-3 h-3 inline mr-1" />}
                      {service}
                    </button>
                  ))}
                </div>
              </div>

              {/* Pricing */}
              <div className="space-y-3">
                <div className="glass rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-gold" />
                    <span className="text-sm font-semibold text-foreground">Hourly Rate *</span>
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
                  <div className="flex items-center gap-2 mb-2">
                    <Moon className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-semibold text-foreground">Overnight Rate (optional)</span>
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

                {/* Custom Packages */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <Package className="w-4 h-4 text-gold" />
                      <span className="text-sm font-semibold text-foreground">Custom Packages</span>
                    </div>
                    <button onClick={() => setCustomPackages((prev) => [...prev, { name: "", price: "", description: "" }])} className="text-gold text-xs flex items-center gap-1 hover:underline">
                      <Plus className="w-3 h-3" /> Add
                    </button>
                  </div>
                  {customPackages.map((pkg, i) => (
                    <div key={i} className="glass rounded-xl p-3 mb-2 space-y-2">
                      <div className="flex justify-between">
                        <input
                          placeholder="Package name"
                          value={pkg.name}
                          onChange={(e) => {
                            const updated = [...customPackages];
                            updated[i] = { ...pkg, name: e.target.value };
                            setCustomPackages(updated);
                          }}
                          className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none flex-1"
                        />
                        <button onClick={() => setCustomPackages((prev) => prev.filter((_, idx) => idx !== i))} className="text-muted-foreground hover:text-destructive">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="relative">
                        <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                        <input
                          type="number"
                          placeholder="Price"
                          value={pkg.price}
                          onChange={(e) => {
                            const updated = [...customPackages];
                            updated[i] = { ...pkg, price: e.target.value };
                            setCustomPackages(updated);
                          }}
                          className="w-full bg-secondary rounded-lg pl-7 pr-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-gold/50"
                        />
                      </div>
                      <input
                        placeholder="Brief description"
                        value={pkg.description}
                        onChange={(e) => {
                          const updated = [...customPackages];
                          updated[i] = { ...pkg, description: e.target.value };
                          setCustomPackages(updated);
                        }}
                        className="w-full bg-secondary rounded-lg px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-gold/50"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {step === 2 && !isCompanion && (
            <motion.div key="guest-prefs" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              <p className="text-muted-foreground text-sm">
                You can customize your preferences later from your profile settings.
              </p>
              <div className="glass rounded-xl p-4 text-center">
                <User className="w-8 h-8 text-gold mx-auto mb-2" />
                <p className="text-sm font-semibold text-foreground">Guest Account</p>
                <p className="text-xs text-muted-foreground">Browse companions and book experiences</p>
              </div>
            </motion.div>
          )}

          {/* Step 3: Gallery (companions only) */}
          {step === 3 && isCompanion && (
            <motion.div key="gallery" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <input ref={galleryFileRef} type="file" accept="image/*" multiple hidden onChange={handleGalleryUpload} />
              <div className="grid grid-cols-3 gap-3">
                {galleryImages.map((img, i) => (
                  <div key={i} className="relative aspect-[3/4] rounded-xl overflow-hidden group">
                    <img src={img.preview || img.imageUrl} alt="" className="w-full h-full object-cover" />
                    <button
                      onClick={() => removeGalleryImage(i)}
                      className="absolute top-1.5 right-1.5 w-7 h-7 bg-destructive rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-4 h-4 text-destructive-foreground" />
                    </button>
                    <div className="absolute bottom-1.5 left-1.5">
                      <ImageStatusBadge status={img.status} rejectionReason={img.rejectionReason} />
                    </div>
                  </div>
                ))}
                {galleryImages.length < 8 && (
                  <button
                    onClick={() => galleryFileRef.current?.click()}
                    disabled={galleryUploading}
                    className="aspect-[3/4] rounded-xl border-2 border-dashed border-border hover:border-gold/50 flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-gold transition-colors"
                  >
                    {galleryUploading ? (
                      <Loader2 className="w-6 h-6 animate-spin" />
                    ) : (
                      <>
                        <Camera className="w-6 h-6" />
                        <span className="text-xs">Add Photo</span>
                      </>
                    )}
                  </button>
                )}
              </div>
              <p className="text-muted-foreground text-xs mt-3 text-center">
                Upload 1–8 photos. Images are automatically reviewed by AI.
              </p>
            </motion.div>
          )}

          {/* Review Step */}
          {step === totalSteps - 1 && (
            <motion.div key="review" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              {/* Profile Preview */}
              <div className="glass-strong rounded-2xl p-5 space-y-4">
                <div className="flex items-center gap-4">
                  {profileImage?.preview && (
                    <img src={profileImage.preview} alt="" className="w-16 h-16 rounded-full object-cover" />
                  )}
                  <div>
                    <h3 className="font-display text-lg font-bold text-foreground">{displayName}</h3>
                    <p className="text-xs text-muted-foreground">{location} • {gender}</p>
                    <p className="text-xs text-gold capitalize">{role}</p>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Bio</p>
                  <p className="text-sm text-foreground">{bio}</p>
                </div>

                {isCompanion && (
                  <>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Services</p>
                      <div className="flex flex-wrap gap-1">
                        {selectedServices.map((s) => (
                          <span key={s} className="text-xs px-2 py-1 rounded-full bg-secondary text-muted-foreground">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Pricing</p>
                      <p className="text-sm text-foreground">
                        ${hourlyRate}/hr
                        {overnightRate && ` • $${overnightRate}/night`}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Gallery</p>
                      <div className="flex gap-2 overflow-x-auto">
                        {galleryImages.map((img, i) => (
                          <img key={i} src={img.preview || img.imageUrl} alt="" className="w-16 h-20 rounded-lg object-cover flex-shrink-0" />
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>

              <p className="text-xs text-muted-foreground text-center">
                By completing your profile, you agree to our terms of service and community guidelines.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation Buttons */}
      <div className="flex gap-3 mt-6 relative">
        {step > 0 && (
          <button
            onClick={() => setStep((s) => s - 1)}
            className="flex-1 bg-secondary text-foreground font-display font-semibold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-secondary/80 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
        )}
        {step < totalSteps - 1 ? (
          <button
            onClick={() => setStep((s) => s + 1)}
            disabled={!canProceed()}
            className="flex-1 gradient-gold text-primary-foreground font-display font-semibold py-3 rounded-xl flex items-center justify-center gap-2 hover:opacity-90 transition-all disabled:opacity-50"
          >
            Continue <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex-1 gradient-gold text-primary-foreground font-display font-semibold py-3 rounded-xl flex items-center justify-center gap-2 hover:opacity-90 transition-all disabled:opacity-50"
          >
            {isSubmitting ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</>
            ) : (
              <><Check className="w-4 h-4" /> Complete Profile</>
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export default OnboardingPage;
