const express = require("express");
const ConnexionDataBase = require("../dataBase/DataBase");
const router = express.Router();



    /* API d'Ajout de Locataire */
    router.post("/Locataires", (req, res)=>{
        const{Nom, Appartements,Loyer, telephone, Date, Caution} = req.body;

        const ReqSQl = `INSERT INTO locataires(Nom, Appartements,Loyer, telephone, Date, Caution) VALUES(?, ?, ?, ?, ?, ?)`;

        ConnexionDataBase.query(ReqSQl, [Nom, Appartements,Loyer, telephone, Date, Caution], (error, Resultat)=>{
            if(error)
            {
                return res.status(500).json({Message: "Erreur d'Ajout du Locataire", error});
            }
                return res.status(201).json({Message: "Ajout Réussir du Locataire !", Resultat});
        });
    });


    /* API d'Affichage de la liste des Locataires */
    router.get("/Locataires", (req, res)=>{

        const ReqsQl = `SELECT * FROM locataires`;

        ConnexionDataBase.query(ReqsQl, (error, resultat)=>{
            if(error)
            {
                return res.status(500).json({Message: "Erreur d'Affichage du Locataire", error});
            }
                return res.status(201).json({Message: "Affichage Réussir du Locataire !", resultat});
        });
    });


    /* API de Suppression */
    router.delete("/Locataires/:id", (req, res)=>{

        const{id} = req.params;

        const ReQsql = `DELETE FROM locataires WHERE id = ?`;

        ConnexionDataBase.query(ReQsql, [id], (error, resultat)=>{
            if(error)
            {
                return res.status(500).json({Message: "Erreur de Suppression du Locataire", error});
            }
                return res.status(201).json({Message: "Suppression Réussir du Locataire !", resultat});
        });
    })
    
















module.exports = router;
