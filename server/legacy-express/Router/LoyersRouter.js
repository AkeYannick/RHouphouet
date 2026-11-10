const express = require("express");
const ConnexionDataBase = require("../dataBase/DataBase");
const router = express.Router();

    /* API d'Ajout (Enregistrement) de Loyer */
    router.post("/Loyers", (req, res)=>{

        const{locataire_id, montantdu, datepaiement, mois, montantrecu, modepaiement} = req.body;

        const ReqSQl = `INSERT INTO loyers(locataire_id, montantdu, datepaiement, mois, montantrecu, modepaiement) VALUES(?, ?, ?, ?, ?, ?)`;

        ConnexionDataBase.query(ReqSQl, [locataire_id, montantdu, datepaiement, mois, montantrecu, modepaiement], (error, Resultat)=>{
            if(error)
            {
                return res.status(500).json({Message: "Erreur d'Ajout du Loyer", error});
            }
                return res.status(201).json({Message: "Ajout Réussir du Loyer !", Resultat});
        });
    })



    
    /* API d'Affichage de la liste des Loyers */
    router.get("/Loyers", (req, res)=>{

        const ReqsQl = `SELECT * FROM loyers`;

        ConnexionDataBase.query(ReqsQl, (error, resultat)=>{
            if(error)
            {
                return res.status(500).json({Message: "Erreur d'Affichage du Loyer", error});
            }
                return res.status(201).json({Message: "Affichage Réussir du Loyer !", resultat});
        });
    });




    /* API de Suppression */
    router.delete("/Loyers/:id", (req, res)=>{

        const{id} = req.params;

        const ReQsql = `DELETE FROM loyers WHERE id = ?`;

        ConnexionDataBase.query(ReQsql, [id], (error, resultat)=>{
            if(error)
            {
                return res.status(500).json({Message: "Erreur de Suppression du Loyer", error});
            }
                return res.status(201).json({Message: "Suppression Réussir du Loyer !", resultat});
        });
    });

module.exports = router;