const express = require("express");
const { connectDB } = require("./config/config");
const dotenv = require("dotenv");
const cors = require("cors");

dotenv.config();
connectDB();

const app = express();
app.use(express.json());
app.use(cors());

const userRoutes = require("./routes/UserRoutes");
const smApplicationRoutes = require("./routes/smApplicationRoutes");
const gatheringRoutes = require("./routes/gatheringRoutes");
const mailRoutes = require("./routes/mailRoutes");

app.use("/users", userRoutes);
app.use("/sm-applications", smApplicationRoutes);
app.use("/gatherings", gatheringRoutes);
app.use("/mail", mailRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
