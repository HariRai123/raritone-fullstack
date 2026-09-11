[1mdiff --git a/backend/src/models/user.model.js b/backend/src/models/user.model.js[m
[1mindex 9a5f395..648dc66 100644[m
[1m--- a/backend/src/models/user.model.js[m
[1m+++ b/backend/src/models/user.model.js[m
[36m@@ -1,8 +1,14 @@[m
 const mongoose = require("mongoose");[m
[31m-const bcrypt = require("bcryptjs");[m
 [m
 const userSchema = new mongoose.Schema([m
   {[m
[32m+[m[32m    firebaseUid: {[m
[32m+[m[32m      type: String,[m
[32m+[m[32m      unique: true,[m
[32m+[m[32m      sparse: true,[m
[32m+[m[32m      index: true,[m
[32m+[m[32m    },[m
[32m+[m
     name: {[m
       type: String,[m
       required: true,[m
[36m@@ -11,18 +17,22 @@[m [mconst userSchema = new mongoose.Schema([m
 [m
     email: {[m
       type: String,[m
[31m-      required: true,[m
[31m-      unique: true,[m
       lowercase: true,[m
       trim: true,[m
[32m+[m[32m      sparse: true,[m
[32m+[m[32m      unique: true,[m
     },[m
 [m
[32m+[m[32m    phone: {[m
[32m+[m[32m      type: String,[m
[32m+[m[32m      trim: true,[m
[32m+[m[32m      sparse: true,[m
[32m+[m[32m      unique: true,[m
[32m+[m[32m    },[m
     password: {[m
       type: String,[m
[31m-      required: true,[m
[31m-      minlength: 6,[m
[32m+[m[32m      select: false,[m
     },[m
[31m-[m
     role: {[m
       type: String,[m
       enum: ["user", "admin", "vendor"],[m
[36m@@ -33,21 +43,23 @@[m [mconst userSchema = new mongoose.Schema([m
       type: String,[m
       default: "",[m
     },[m
[32m+[m
[32m+[m[32m    provider: {[m
[32m+[m[32m      type: String,[m
[32m+[m[32m      enum: ["password", "google", "phone"],[m
[32m+[m[32m      required: true,[m
[32m+[m[32m    },[m
[32m+[m
[32m+[m[32m    isActive: {[m
[32m+[m[32m      type: Boolean,[m
[32m+[m[32m      default: true,[m
[32m+[m[32m    },[m
   },[m
   {[m
     timestamps: true,[m
   },[m
 );[m
 [m
[31m-// Password hashing middleware[m
[31m-userSchema.pre("save", async function () {[m
[31m-  if (!this.isModified("password")) {[m
[31m-    return;[m
[31m-  }[m
[31m-[m
[31m-  this.password = await bcrypt.hash(this.password, 10);[m
[31m-});[m
[31m-[m
 const User = mongoose.model("User", userSchema);[m
 [m
 module.exports = User;[m
