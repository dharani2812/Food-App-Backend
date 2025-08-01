import jwt from "jsonwebtoken";

const auth = (req, res, next) => {
  const token = req.header("Authorization")?.split(" ")[1]; // ✅ Extract from Bearer token

  if (!token) {
    return res.status(401).json({ msg: "No token, authorization denied" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ msg: "Token is not valid" });
  }
};

export default auth;
