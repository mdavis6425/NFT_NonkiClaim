/*
  This program and the accompanying materials are
  made available under the terms of the Eclipse Public License v2.0 which accompanies
  this distribution, and is available at https://www.eclipse.org/legal/epl-v20.html
  
  SPDX-License-Identifier: EPL-2.0
  
  Copyright IBM Corporation 2020
*/

const signService = require('../services/sign.service');

const get = function(req, res){
    res.send(signService.get(req.params._id))
}

const getAll = async function(req, res){
    const result = await signService.getAll(req.body.userAddress)
    res.send( result )
}

module.exports = {
    get,
    getAll
};