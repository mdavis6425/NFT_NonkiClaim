/*
  This program and the accompanying materials are
  made available under the terms of the Eclipse Public License v2.0 which accompanies
  this distribution, and is available at https://www.eclipse.org/legal/epl-v20.html
  
  SPDX-License-Identifier: EPL-2.0
  
  Copyright IBM Corporation 2020
*/

const express = require('express');
const router = express.Router({ mergeParams: true });

const signController = require('../controllers/sign.controller');

router.route('/')
    .post(signController.getAll);

router.route('/:_id')
    .get(signController.get);

module.exports = router;