'use strict';
const express = require('express');
const router = express.Router();
const File = require('@models/file');
let path = require('path');
const {
    copyFile,
    checkDataBody,
    checkIfExistsFile,
    checkTypeFile,
    getModelByType,
    removeFile
} = require('@middlewares/upload-file');



router.post('/uploadfile', checkIfExistsFile, checkTypeFile, checkDataBody, copyFile, (req, res) => {
    console.log('leeeeeeeegaaaaa');
    const {_id, type, file} = req.body;
    const newFile = new File(file);
    let fileData;
    return newFile.save()
        .then((data) => {
            fileData = data;
            if (_id) {
                const model = getModelByType(type);
                return model.update({_id: _id}, {image: fileData._id});
            }
            return true;  
        })
        .then(() => {
            console.log(fileData);
            return res.status(200).json(fileData);
        })
        .catch((err) => {
            console.error(`UPLOAD-FILE SAVE ${err.message}`);
            if (err.code !== 11000) {
                return removeFile(req.body.file, res);
            }
            return res.status(500).json({
                errorCode: 500,
                userMessage: 'internal_error'
            });
        });
});

router.get('/images/:typeFile/:nameFile',(req, res) => {
    res.sendFile(path.resolve(`${__dirname}../../../public/images/${req.params.typeFile}/${req.params.nameFile}`));
});


module.exports = router;
