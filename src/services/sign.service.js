/*
  This program and the accompanying materials are
  made available under the terms of the Eclipse Public License v2.0 which accompanies
  this distribution, and is available at https://www.eclipse.org/legal/epl-v20.html
  
  SPDX-License-Identifier: EPL-2.0
  
  Copyright IBM Corporation 2020
*/

const data = require('../data');
// import { ethers } from "ethers";
const { ethers } = require('ethers');
const Web3 = require('web3');
const fetch = require('node-fetch');
const nonkishibaABI = require('../constants/nonkishiba-contract-abi.json');
const nonkiclaimABI = require('../constants/nonkiclaim-contract-abi.json');


//const web3 = new Web3(Web3.givenProvider || 'http://localhost:8546');
// onlyTest
const web3 = new Web3(new Web3.providers.HttpProvider('https://mainnet.infura.io/v3/aa809e00a0bd4aeaaff8e78212c654ff'));
const web33 = new Web3(new Web3.providers.HttpProvider('https://mainnet.infura.io/v3/aa809e00a0bd4aeaaff8e78212c654ff'));

// onlyTest
const contractAddress = '0xFF67eD7F1C7A5Cc1b65958D4b3add53dd1a2f86B'
//const nClaimContractAddress = '0x488fC2bc35B622a5D4bC034a90a822F85D053584'
const nClaimContractAddress = '0x2Fc04781b8AFE45F122f86FF0f862D65995EF004'

const get = function(_id){
    return getAll().find(car => car._id == _id);
}

const getAll = async function(userAddress) {
  // let privateKey = '2737242de1bbf32fd89df3cc53d75d6ec4f95460ba88a9c25895b3e46f3ea853';
  // let wallet = new ethers.Wallet(privateKey);
  // let message = "Test"
  // let signature = await wallet.signMessage(message);

  // let wallet = await web3.eth.accounts.create();


  let contract = new web3.eth.Contract(nonkishibaABI, contractAddress);
  let nClaimContract = new web33.eth.Contract(nonkiclaimABI, nClaimContractAddress);
	   
  // onlyTest
  // userAddress = "0x82155471361f02CEa469e71D8af5EFBD60FBF3DA";
  
  let balanceOf = await contract.methods.balanceOf(userAddress).call();	
  let isMigrated = await nClaimContract.methods.isMigrated(userAddress).call();	
  let holder;
  if(isMigrated) holder = await nClaimContract.methods.holders(userAddress).call();
  else holder = await contract.methods.holders(userAddress).call();
  let claimedTokens = Math.floor(holder.rewardAmount / 1000000000000000000);
  let diff = 0;
  if(holder.startDate != 0) diff = Math.floor((Math.floor(Date.now() / 1000) - holder.startDate) / 86400);
  let availableTokens = 0;//diff * 10 * balanceOf;
  let tokensPerDay = 10;
  let onceForMint = false;
  let calculable = true;

  const options = {
    method: 'GET',
    // headers: {Accept: 'application/json', 'X-API-KEY': '47737e2229ae45d9a106a1ab71c84ca6'}
    headers: {Accept: 'application/json', 'X-API-KEY': '252e663e41a046eba7c8c24093b2c6a1'}
  };

  //opensea api: Retrieve events
  const res = await fetch(`https://api.opensea.io/api/v1/events?asset_contract_address=0xFF67eD7F1C7A5Cc1b65958D4b3add53dd1a2f86B&account_address=${userAddress}&event_type=transfer&only_opensea=false`, options);
  const data = await res.json();
  let transfers = data.asset_events;
  let balanceAtTime = balanceOf;
  
  transfers.map((transfer, index) => {
    let fromAccount = transfer.from_account.address.toLowerCase();
    let nullAddress = "0x0000000000000000000000000000000000000000";
    let transactionTimestamp = Date.parse(transfer.transaction.timestamp);
    let tDate = new Date(transactionTimestamp);
    let tMilliseconds = tDate.getTime(); 
    let duration = Math.floor((Date.now() - tMilliseconds) / (1000*60*60*24));

    if(calculable && Math.floor(transactionTimestamp / 1000) <= holder.startDate) {
      // onlyTest
      duration = Math.floor((Math.floor(Date.now() / 1000) - holder.startDate) / 86400);
      // duration = Math.floor((Math.floor(Date.now() / 1000) - holder.startDate) / 60);

      availableTokens += balanceAtTime * duration * tokensPerDay;
      console.log("duration: " + duration + " calculable: " + availableTokens + " at " + transfer.asset.token_id + " for " + balanceAtTime);

      calculable = false;
    }
    if(!onceForMint && calculable) {
      if(fromAccount == userAddress.toLowerCase()) {
        //out
        balanceAtTime ++;
        availableTokens -= duration * tokensPerDay;
        console.log("out: ", availableTokens + " at " + transfer.asset.token_id + " for " + balanceAtTime);
      }
      else if(fromAccount == nullAddress) {
        //mint
        availableTokens += balanceAtTime * duration * tokensPerDay;
        onceForMint = true;
        console.log("mint: ", availableTokens + " at " + transfer.asset.token_id + " for " + balanceAtTime);
      } else {
        //in
        balanceAtTime --;
        availableTokens += duration * tokensPerDay;
        console.log("in: ", availableTokens + " at " + transfer.asset.token_id + " for " + balanceAtTime);
      }
    }
  })

  console.log(">>>>> claimedTokens: ", claimedTokens);
  console.log(">>>>> availableTokens: ", availableTokens);

  let wallet = web3.eth.accounts.privateKeyToAccount('2737242de1bbf32fd89df3cc53d75d6ec4f95460ba88a9c25895b3e46f3ea853');

  let mesGenerated = 
    ethers.utils.solidityKeccak256(
        ['bytes'],
        [
            ethers.utils.solidityPack(
                ['uint256', 'uint256', 'uint256', 'address'],
                [holder.startDate, availableTokens, claimedTokens, userAddress]
            )
        ]
    )

  let signatureJson = wallet.sign(mesGenerated)
  let signature = signatureJson.signature
  let startDate = holder.startDate

  console.log(">>>>> signature: ", signature)
  console.log(">>>>> startDate: ", startDate)

  return {
    signature,
    claimedTokens,
    availableTokens,
    startDate
  };
}

module.exports = {
    get,
    getAll
};