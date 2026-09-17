const User = require("../models/user.model");
const uploadFile = require("../services/storage.service");

const serializeUser = (user) => ({
  id: user._id,
  firebaseUid: user.firebaseUid,
  name: user.name,
  email: user.email,
  phone: user.phone,
  profileImage: user.profileImage,
  role: user.role,
  provider: user.provider,
  profileCompleted:
    user.profileCompleted ?? false,
  isActive: user.isActive,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});


/*
|--------------------------------------------------------------------------
| LOGIN SYNC
|--------------------------------------------------------------------------
*/

const syncFirebaseUser = async (
  req,
  res,
) => {
  try {
    const {
      firebaseUid,
      email,
      phone,
      name,
      profileImage,
      provider,
    } = req.user || {};

    console.log(
      "🔥 FIREBASE LOGIN SYNC",
    );

    console.log({
      firebaseUid,
      email,
      phone,
      name,
      provider,
    });

    if (!firebaseUid) {
      return res.status(400).json({
        message:
          "Firebase user ID is missing",
      });
    }

    const user =
      await User.findOne({
        firebaseUid,
      });

    if (!user) {
      console.log(
        "❌ USER ACCOUNT NOT FOUND IN MONGODB:",
        firebaseUid,
      );

      return res.status(404).json({
        message:
          "User account not found",
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        message:
          "Your account has been deactivated",
      });
    }

    /*
     * Update Firebase-linked information.
     *
     * Do NOT mark profileCompleted here.
     * Profile completion is controlled by
     * the Profile Setup screen.
     */

    if (name) {
      user.name = name;
    }

    if (email) {
      user.email =
        email.toLowerCase();
    }

    if (phone) {
      user.phone = phone;
    }

    if (profileImage) {
      user.profileImage =
        profileImage;
    }

    if (provider) {
      user.provider =
        provider;
    }

    await user.save();

    console.log(
      "✅ FIREBASE USER LOGIN SYNC SUCCESS:",
      user._id,
    );

    return res.status(200).json({
      message:
        "User synced successfully",

      user:
        serializeUser(user),
    });
  } catch (error) {
    console.error(
      "Firebase login sync error:",
      error,
    );

    return res.status(500).json({
      message:
        "Failed to sync user",

      error:
        error.message,
    });
  }
};


/*
|--------------------------------------------------------------------------
| FIREBASE REGISTRATION
|--------------------------------------------------------------------------
*/

const registerFirebaseUser = async (
  req,
  res,
) => {
  try {
    const {
      firebaseUid,
      email,
      phone,
      name,
      profileImage,
      provider,
    } = req.user || {};

    console.log(
      "🔥 REGISTER FIREBASE USER CONTROLLER HIT",
    );

    console.log({
      firebaseUid,
      email,
      phone,
      name,
      provider,
    });

    if (!firebaseUid) {
      return res.status(400).json({
        message:
          "Firebase user ID is missing",
      });
    }

    if (!email && !phone) {
      return res.status(400).json({
        message:
          "Email or phone is required",
      });
    }

    /*
     * Firebase UID duplicate check
     */

    const existingFirebaseUser =
      await User.findOne({
        firebaseUid,
      });

    if (existingFirebaseUser) {
      return res.status(409).json({
        message:
          "An account already exists for this Firebase account. Please sign in instead.",
      });
    }

    /*
     * Email duplicate check
     */

    const cleanEmail =
      email?.trim().toLowerCase();

    if (cleanEmail) {
      const existingEmailUser =
        await User.findOne({
          email: cleanEmail,
        });

      if (existingEmailUser) {
        return res.status(409).json({
          message:
            "An account already exists with this email address. Please sign in instead.",
        });
      }
    }

    /*
     * Phone duplicate check
     */

    const cleanPhone =
      phone?.trim();

    if (cleanPhone) {
      const existingPhoneUser =
        await User.findOne({
          phone: cleanPhone,
        });

      if (existingPhoneUser) {
        return res.status(409).json({
          message:
            "An account already exists with this phone number. Please sign in instead.",
        });
      }
    }

    /*
     * Provider
     */

    let safeProvider =
      provider;

    if (!safeProvider) {
      safeProvider =
        cleanPhone
          ? "phone"
          : "password";
    }

    const allowedProviders = [
      "password",
      "google",
      "phone",
    ];

    if (
      !allowedProviders.includes(
        safeProvider,
      )
    ) {
      safeProvider =
        "password";
    }

    /*
     * Create MongoDB user.
     *
     * IMPORTANT:
     * profileCompleted remains false.
     * It will become true only after
     * Profile Setup is submitted.
     */

    const user =
      await User.create({
        firebaseUid,

        name:
          name?.trim() ||
          "Raritone User",

        email:
          cleanEmail ||
          undefined,

        phone:
          cleanPhone ||
          undefined,

        profileImage:
          profileImage || "",

        provider:
          safeProvider,

        role: "user",

        profileCompleted:
          false,

        isActive: true,
      });

    console.log(
      "✅ FIREBASE USER CREATED IN MONGODB:",
      user._id,
    );

    return res.status(201).json({
      message:
        "User registered successfully",

      user:
        serializeUser(user),
    });
  } catch (error) {
    console.error(
      "Firebase registration error:",
      error,
    );

    if (
      error?.code === 11000
    ) {
      return res.status(409).json({
        message:
          "An account already exists with the provided information.",
      });
    }

    return res.status(500).json({
      message:
        "Failed to register Firebase user",

      error:
        error.message,
    });
  }
};


/*
|--------------------------------------------------------------------------
| UPDATE PROFILE
|--------------------------------------------------------------------------
*/

const updateFirebaseProfile = async (req, res) => {
  try {
    const firebaseUid = req.user?.firebaseUid;

    if (!firebaseUid) {
      return res.status(401).json({
        message: "Firebase user ID is missing",
      });
    }

    const user = await User.findOne({ firebaseUid });

    if (!user) {
      return res.status(404).json({
        message: "User account not found",
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        message: "Your account has been deactivated",
      });
    }

    const {
      name,
      phone,
      gender,
      height,
      weight,
      clothingSize,
    } = req.body || {};

    /*
     * ---------------------------------------------------------
     * BASIC PROFILE INFORMATION
     * ---------------------------------------------------------
     */

    if (typeof name === "string" && name.trim()) {
      user.name = name.trim();
    }

    if (typeof phone === "string") {
      user.phone = phone.trim();
    }

    if (typeof gender === "string") {
      user.gender = gender.trim();
    }

    if (typeof height === "string") {
      user.height = height.trim();
    }

    if (typeof weight === "string") {
      user.weight = weight.trim();
    }

    if (typeof clothingSize === "string") {
      user.clothingSize = clothingSize.trim();
    }

    /*
     * ---------------------------------------------------------
     * PROFILE IMAGE
     * ---------------------------------------------------------
     *
     * Mobile app sends:
     *
     * profileImage -> multipart/form-data file
     *
     * Multer puts the file inside req.file.
     */

    if (req.file) {
      console.log("📸 PROFILE IMAGE RECEIVED");

      console.log({
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
      });

      const fileExtension =
        req.file.originalname.includes(".")
          ? req.file.originalname.substring(
              req.file.originalname.lastIndexOf("."),
            )
          : ".jpg";

      const fileName =
        `profile-${firebaseUid}-${Date.now()}${fileExtension}`;

      const uploadResult = await uploadFile(
        req.file.buffer,
        fileName,
      );

      console.log("✅ PROFILE IMAGE UPLOADED TO IMAGEKIT");

      if (!uploadResult?.url) {
        throw new Error(
          "ImageKit upload succeeded but no URL was returned.",
        );
      }

      user.profileImage = uploadResult.url;

      console.log(
        "🖼️ IMAGEKIT URL:",
        uploadResult.url,
      );
    }

    /*
     * ---------------------------------------------------------
     * PROFILE COMPLETION
     * ---------------------------------------------------------
     */

    user.profileCompleted = true;

    await user.save();

    console.log(
      "✅ PROFILE UPDATED:",
      user._id,
    );

    return res.status(200).json({
      message: "Profile updated successfully",
      user: serializeUser(user),
    });
  } catch (error) {
    console.error(
      "Profile update error:",
      error,
    );

    return res.status(500).json({
      message: "Failed to update profile",
      error: error.message,
    });
  }
};


/*
|--------------------------------------------------------------------------
| EXPORTS
|--------------------------------------------------------------------------
*/

module.exports = {
  syncFirebaseUser,
  registerFirebaseUser,
  updateFirebaseProfile,
};