import bcrypt from "bcryptjs";

const password = "Admin@123";
const hash = bcrypt.hashSync(password, 10);

console.log("Password:", password);
console.log("Hash:", hash);
