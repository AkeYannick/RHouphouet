const express = require("express");
const ConnexionDataBase = require("../dataBase/DataBase");
const router = express.Router();



    /* API d'Ajout de charge */
    router.post("/Charges", (req, res)=>{
        const{Locataire_id, Nomch, categorie, date, montant} = req.body;

        const ReqSQl = `INSERT INTO charges(Locataire_id, Nomch, categorie, date, montant) VALUES(?, ?, ?, ?, ?)`;

        ConnexionDataBase.query(ReqSQl, [Locataire_id, Nomch, categorie, date, montant], (error, Resultat)=>{
            if(error)
            {
                return res.status(500).json({Message: "Erreur d'Ajout de la charge", error});
            }
                return res.status(201).json({Message: "Ajout Réussir de la charge !", Resultat});
        });
    });


    /* API d'Affichage de la liste des charges */
    router.get("/Charges", (req, res)=>{

        const ReqsQl = `SELECT * FROM charges`;

        ConnexionDataBase.query(ReqsQl, (error, resultat)=>{
            if(error)
            {
                return res.status(500).json({Message: "Erreur d'Affichage de la charge", error});
            }
                return res.status(201).json({Message: "Affichage Réussir de la charge !", resultat});
        });
    });

    /* API de Suppression */
    router.delete("/Charges/:id", (req, res)=>{

        const{id} = req.params;

        const ReQsql = `DELETE FROM charges WHERE id = ?`;

        ConnexionDataBase.query(ReQsql, [id], (error, resultat)=>{
            if(error)
            {
                return res.status(500).json({Message: "Erreur de Suppression de la charge", error});
            }
                return res.status(201).json({Message: "Suppression Réussir de la charge !", resultat});
        });
    });

module.exports = router;