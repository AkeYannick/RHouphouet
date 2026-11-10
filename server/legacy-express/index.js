const express = require("express");
const cors = require("cors");
const port = 5000;

const app = express();

app.use(cors());
app.use(express.json());


const Locataires = require("./Router/LocatairesRouter");
const Loyers = require("./Router/LoyersRouter");
const Charges = require("./Router/Charges");




app.use("/api", Locataires);
app.use("/api", Loyers);
app.use("/api", Charges);








app.listen(port, () => {
    console.log("Server activé sur le port: " + port);
});