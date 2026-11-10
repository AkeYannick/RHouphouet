const express = require("express");
const mysql2 = require("mysql2");


const ConnexionDataBase = mysql2.createConnection({
    host: "localhost",
    database: "R_Houphouet",
    user: "root",
    password: "",
});

ConnexionDataBase.connect((error, result)=>{
    if(error)
    {
        console.log("Erreur de Connexion a la base de Données");
    }
    else{
        console.log("Connexion a la base de Données Réussir ...!");
    }
});


module.exports = ConnexionDataBase;