'use strict';
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const carritoSchema = new Schema({
        items: [
                    {
                        product: {
                            type: Schema.Types.ObjectId, //indica q este atributo sera un id
                            ref: 'Product', // a que tabla hace referencia
                            
                        },
                        quantity: Number
                }],
            subUsuario:{
                type: String,
                required: true // este campo es obligatorio
            }
        }
,       
        {
            timestamps:true
        });
    //timestamps: true //timestamps te crea automaticamente la fecha de creacion y fecha de modificado

module.exports = mongoose.model('Cart', carritoSchema);