'use strict';
const express = require('express');
const router = express.Router();

const Cart = require('@models/carrito');
const Admin = require('@models/admin');

const AmazonCognitoIdentity = require('amazon-cognito-identity-js');
const CognitoUserPool = AmazonCognitoIdentity.CognitoUserPool;
const AWS = require('aws-sdk');
const jwkToPem = require('jwk-to-pem');
const jwt = require('jsonwebtoken');
const poolData = {    
    UserPoolId : "us-east-2_PdnQkA2Bb", // Your user pool id here    
    ClientId : "7n6ktka00arkrikn2et9uget3k" // Your client id here
}; 
const pool_region = 'us-east-2';

router.post('/login', (req, res) => {
    const JWT_SECRET = process.env.JWT_SECRET;
    const JWT_ISSUER = process.env.JWT_ISSUER;
    let userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);
    const email = req.body.email.trim();
    const password = req.body.password.trim();
    var authenticationDetails = new AmazonCognitoIdentity.AuthenticationDetails({
        Username : email,
        Password : password,
    });

    var userData = {
        Username : email,
        Pool : userPool
    };
    var cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);
    cognitoUser.authenticateUser(authenticationDetails, {
        onSuccess: function (result) {
            const tokenDecodedByAWS = result.getIdToken().payload;
            return Admin.findOne({email})
            .then((admin) => {
                const dataUser = { //creamos un json
                    userSub : tokenDecodedByAWS.sub,
                    userEmailVerified : tokenDecodedByAWS.email_verified,
                    userName : tokenDecodedByAWS.name,
                    userLastName : tokenDecodedByAWS.family_name,
                    userEmail: tokenDecodedByAWS.email
                };

                if(admin){  //modificamos el json y le asignamos un rol
                    dataUser.userRol = 'admin';
                }else{
                    dataUser.userRol = 'user';
                }
                const token = jwt.sign( // aca crea el token
                    dataUser,
                    JWT_SECRET,
                    {
                        expiresIn: '1d',
                        issuer: JWT_ISSUER
                    }
                );
                return res.status(200).json({token});

            })
            .catch((err) => {
                console.log(err);
                return res.status(500).json({
                    mensajeMostrar: 'Error login usuario'
                });
            });
        },
        onFailure: function(err) {
            console.log(err);
            return res.status(500).json({
                mensajeMostrar: 'Error login usuario'
            });
        },
    });

});
router.post('/check', (req, res) => {

    let userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);
    const email = req.body.email.trim(); //saca espacios finales e iniciales
    const code = req.body.code;

    var userData = {
        Username : email,
        Pool : userPool
    };
    var cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);
    cognitoUser.confirmRegistration(code, true, function(err, result) {
        if (err) {
            console.log(err);
            return res.status(500).json({
                mensajeMostrar: 'Error verificar usuario'
            });
        }
        console.log('callresult' + result);
        return res.status(200).json({
            mensajeMostrar: 'usuario verificado'
        });
    });

});
router.post('/resendConfirmCode', (req, res) => {

    let userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);
    const email = req.body.email.trim();

    var userData = {
        Username : email,
        Pool : userPool
    };
    var cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);
    cognitoUser.resendConfirmationCode(function(err, result) {
        if (err) {
            console.log(err);
            return res.status(500).json({
                mensajeMostrar: 'Error reenviar codigo'
            });
        }
        console.log('callresult' + result);
        return res.status(200).json({
            mensajeMostrar: 'codigo reenviado'
        });
    });

});

router.post('/forgotPassword', (req, res) => {

    let userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);
    const email = req.body.email.trim();

    var userData = {
        Username : email,
        Pool : userPool
    };
    var cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);
    cognitoUser.forgotPassword({
        onSuccess: function(result) {
            console.log('call result: ' + result);
            return res.status(200).json({
                mensajeMostrar: "olvido contrase??a"
            });
        },
        onFailure: function(err) {
            console.log(err);
            return res.status(500).json({
                mensajeMostrar: "error olvido contrase??a"
            });
        }
    });

});
router.post('/forgotPassword/confirm', (req, res) => {

    let userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);
    const email = req.body.email.trim();
    const code = req.body.code;
    const newPassword = req.body.password.trim();
    var userData = {
        Username : email,
        Pool : userPool
    };
    var cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);
    cognitoUser.confirmPassword(code,newPassword,{
        onSuccess: function(result) {
            console.log('call result: ' + result);
            return res.status(200).json({
                mensajeMostrar: "contrase??a reestablecida"
            });
        },
        onFailure: function(err) {
            console.log(err);
            return res.status(500).json({
                mensajeMostrar: "error restablecer contrase??a"
            });
        }
    });

});

router.post('/register', (req, res) => {
        let userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);
        const name = req.body.name.trim();
        const lastName = req.body.lastName.trim();
        const email = req.body.email.trim();
        const password = req.body.password.trim();
        const direccion = req.body.direccion.trim();
        var carrito
        var items = [];

        var attributeList = [];
        attributeList.push(new AmazonCognitoIdentity.CognitoUserAttribute({Name:"name",Value: name}));
        attributeList.push(new AmazonCognitoIdentity.CognitoUserAttribute({Name:"family_name",Value: lastName}));
        attributeList.push(new AmazonCognitoIdentity.CognitoUserAttribute({Name:"address",Value: direccion}));
        attributeList.push(new AmazonCognitoIdentity.CognitoUserAttribute({Name:"email",Value: email}));
        
        userPool.signUp(email, password, attributeList, null, 
        function(err, result){
            if (err) {
                console.log(err);
                return res.status(500).json({
                    mensajeMostrar: 'Error registrar usuario'
                });
            }
            return Cart.create(
                {
                    items: items,
                    subUsuario: result.userSub
                }
            ).then(() => {
                return res.status(200).json({
                    mensajeMostrar: 'usuario registrado'
                });
            });
        });
});

module.exports = router;