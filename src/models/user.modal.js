import mongoose, { Schema, model } from "mongoose";
import bcrypt from "bcrypt"


const userSchema = new Schema({
    full_name: { type: String },
    email: { type: String, required: true, unique: true,lowercase: true },
    password: { type: String, required: true },
    desigination: { type: String },
    user_id: { type: String, unique: true, index: true, sparse: true },
    employee_plant: { type: Schema.Types.ObjectId, ref: "Plant" },
    employee_company: { type: Schema.Types.ObjectId, ref: "Company" },
    role: { type: Schema.Types.ObjectId, ref: "Role" },
    terminate: { type: Boolean, required: true, default: false },
    refresh_token: { type: String },
    is_admin:{type:Boolean,required:true,default:false}
}, { timestamps: true });

userSchema.index({email:1,user_id:1,employee_plant:1,employee_company:1,role:1});

userSchema.pre("save", async function () {
    if (this.isNew && this.role) {
        const lastUser = await mongoose
            .model("User")
            .findOne({ user_id: { $exists: true } })
            .sort({ createdAt: -1 })
            .select("user_id");

        let nextNumber = 1;

        if (lastUser?.user_id) {
            const lastNumber = parseInt(lastUser.user_id.split("-")[1], 10);
            nextNumber = lastNumber + 1;
        }

        this.user_id = `EMP-${String(nextNumber).padStart(4, "0")}`;
    }

    if (this.isModified("password")) {
        this.password = await bcrypt.hash(this.password, 10);
    }
});

userSchema.pre("findOneAndUpdate", async function () {
    const update = this.getUpdate();

    if (!update) return;

    const password =
        update.password || (update.$set && update.$set.password);

    if (!password) return;

    const hashed = await bcrypt.hash(password, 10);

    if (update.password) {
        update.password = hashed;
    } else {
        update.$set.password = hashed;
    }
});






export const UserModel = model("User", userSchema);