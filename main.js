//importing the necessary libraries
const SHA256 = require("crypto-js/sha256");
const temp = require('rpi-temperature');
//var gpio = require("pi-gpio"); //--- NOT WORKING RIGHT NOW, WILL CHECK THIS OUT TO INTERFACE 
								 //    HARDWARE WITH SOFTWARE

//interfacing with the appropriate pin on raspberry pi with the software
var ldrPin = 7; //pin to connect the ldr to the raspberry pi
var tempPin = 6; // pin to connect the temp36 to the raspberry pi

class Block {
	/**
	 *  Creates an object of the block
	 *
	 *  @param index         The address of the block
	 *  @param timeStamp     The timestamp for the creation of the block
	 *  @param isSeller      A boolean to check if the device is solely used for customer purpose
	 *  @param tempData      The temperature sensor data that was read from the block
	 *  @param lightData     The light sensor data that was read from the block
	 *  @param balance       The amount of money that the block hasAttribute
	 *  @param prevHash      The hash that connects to the previous block to check for validation
	 */
    constructor(index, timestamp, zipcode, isSeller, tempData, lightData, balance, prevHash = '') {
        this.index = index;
        this.prevHash = prevHash;
        this.timestamp = timestamp;
		this.zipcode = zipcode;
		this.isSeller = isSeller;
		this.tempData = 0;
		this.lightData = 0;
		//setting the data if the block belongs to the solar producer
		if(this.isSeller === true){
			this.tempData = tempData;
			this.lightData = lightData;
		}
		this.balance = balance;
        this.hash = this.calculateHash();
        this.nonce = 0;
    }

	/**
	 *  Calculates the hash of a block
	 *
	 *  @return              The SHA256 hash of a block
	 */
    calculateHash() {
		return SHA256(this.index + this.prevHash + this.timestamp + this.zipcode + this.nonce).toString();
    }

	/**
	 *  Mines for the hash of a block to check whether it belongs to the blockchain
	 *
	 *  @param level         The level of encryption or difficulty that the miner will have to mine for
	 */
    mineBlock(level) {
        while (this.hash.substring(0, level) !== Array(level + 1).join("0")) {
            this.nonce++;
            this.hash = this.calculateHash();
        }

        console.log("BLOCK MINED: " + this.hash);
    }
	
	/**
	 *  Updates the temperature data from the temperature sensor within this block
	 */
	addTempData(tempData){
		if(isSeller === true){
			this.tempData = tempData; 
		}
	}
	
	/**
	 *  Updates the light data from the light sensor within this block
	 */
	addLightData(lightData){
		if(isSeller === true){
			this.lightData = lightData;
		}
	}
}


class Blockchain{
	/**
	 *  Acts as the constructor to create an object for blockchain
	 */
    constructor() {
		this.numBlocks = -1;
        this.chain = [this.createGenesisBlock()];
        this.level = 5;
		this.prevAvgTemp = 0; //the previous average temperature recorded in the blockchain 
    }

	/**
	 *  Creates the first block within a blockchain
	 *
	 *  @return              The first block within the blockchain
	 */
    createGenesisBlock() {
		this.numBlocks += 1;
        return new Block(0, "01/01/2017", "30609", true, 30, 40, 0);
    }

	/**
	 *  Retrieves the last block created within a blockchain
	 *
	 *  @return              The last block created in the blockchain
	 */
    getLatestBlock() {
        return this.chain[this.chain.length - 1];
    }
	
	/**
	 *  Retrieves the number of blocks within a blockchain
	 *
	 *  @return              The number of blocks within a blockchain
	 */
	countBlocks(){
		return this.chain.length;
	}

	/**
	 *  Adds a new block to the blockchain
	 *
	 *  @param newBlock      The block to be added to the blockchain
	 */
    addBlock(newBlock) {
		if(newBlock.zipcode === this.chain[0].zipcode){
			newBlock.prevHash = this.getLatestBlock().hash;
			newBlock.mineBlock(this.level);
			this.chain.push(newBlock);
			this.numBlocks += 1;
			
			//checking the indices to make sure they are not repeated
			var isIndexSame = false;
			for(let i = 0; i < (this.chain.length - 1) && isIndexSame === false; i++){
				if(newBlock.index === this.chain[i].index){
					isIndexSame = true;
				}
			}
			
			if(isIndexSame === true){
				console.log('The index of this new block already exiats!'); //ERROR MESSAGE
				console.log('The index of this new block will be ', this.numBlocks);
				newBlock.index = this.numBlocks;
			}
		}
		else{
			console.log('Cannot add this block due to hashing not match!');
		}
    }

	/**
	 *  Retrieves the number of blocks within a blockchain
	 *
	 *  @return              The number of blocks within a blockchain
	 */
    isChainValid() {
        for (let i = 1; i < this.chain.length; i++){
            const currentBlock = this.chain[i];
            const prevBlock = this.chain[i - 1];

            if (currentBlock.hash !== currentBlock.calculateHash()) {
                return false;
            }
            if (currentBlock.prevHash !== prevBlock.hash) {
                return false;
            }
			if (currentBlock.zipcode !== prevBlock.zipcode){
				return false; 
			}
        }

        return true;
    }
	
	//WORKING TO FIND A WAY TO MULTIPLY DECIMAL ON THE FUTURE IMPROVEMENT
	/**
	 * Calculate a set price for all the producer blocks to sell to other blocks 
	 *
	 * @return              The set price to be sold by the blocks
	 */
	calculatePrice(){
		//checking for sunlight
		var minDevices = 1.5; //needing to find a way to calculate this better
		var tally = 0; //keeping track of the number devices detecting sunlight
		var isSunlight = false; //keeping track if there is sunlight
		for(let i = 0; i < this.chain.length; i++){
			var individualLightData = Number(this.chain[i].lightData);
			if(individualLightData > 50){
				tally += 1;
			}
		}
		if(tally >= minDevices){
			isSunlight = true; //returning a boolean to check if there's sunlight
		}
		
		//calculating price
		if(isSunlight === false){
			console.log('There is no sunlight, no electricity can be sold');
			return 0;
		}
		else{
			var price = 0;
			var tempTotal = 0;
			for(let j = 0; j < this.chain.length; j++){
				var individualTempData = Number(this.chain[j].tempData);
				tempTotal += individualTempData;
				//console.log('TempTotal [', j, ']: ', tempTotal);
			}
			var tempAvg = Math.round(tempTotal / this.chain.length); //rounding for right now 
			//setting the simplistic price for proof of concept
			//--> will make it more complicated as I work with hardware
			if(tempAvg > this.prevTempAvg){
				price = tempAvg * 4; //artificial price setting for right now
			}
			else{
				price = tempAvg * 2; //artificial price setting for right now
			}
			this.prevTempAvg = temp;
			return price;
		}
	}
	
	/**
	 *  Makes a transaction for electricity between one block with another within a blockchain
	 *
	 *  @param fromAddress   The customer's address
	 *  @param toAddress     The solar producer's address
	 *  @param amount        The amount of money being sent from the customer to producer
	 */
	makeTransaction(fromAddress, toAddress, amount){
		//checking to see if the address are valid --> DOUBLE SAFEGUARD FEATURE
		var isFromAddressValid = false;
		var isToAddressValid = false;
		var fromAddressBlockIndex; //saving the index to affect the fromAddress block
		var toAddressBlockIndex; //saving the index to affect the toAddress block
		for(let i = 0; i < this.chain.length; i++){
			if(this.chain[i].index === fromAddress){
				isFromAddressValid = true;
				fromAddressBlockIndex = i;
			}
			if(this.chain[i].index === toAddress){
				isToAddressValid = true;
				toAddressBlockIndex = i;
			}
		}
		
		//performing the transaction
		if(isFromAddressValid === true && isToAddressValid === true){
			if(this.chain[fromAddressBlockIndex].zipcode !== this.chain[toAddressBlockIndex].zipcode){
				console.log('This transaction cannot take place since the zipcodes do not match!');
			}
			if(this.chain[toAddressBlockIndex].isSeller === false){
				//cannot sell electricity
				console.log('The transactoon cannot be made since the money is not going to a solar producer!');
			}
			else{
				//checking for sunlight
				var minDevices = 1.5; //needing to find a way to calculate this better
				var tally = 0; //keeping track of the number devices detecting sunlight
				var isSunlight = false; //keeping track if there is sunlight
				for(let i = 0; i < this.chain.length; i++){
					var individualLightData = Number(this.chain[i].lightData);
					if(individualLightData > 50){
						tally += 1;
					}
				}				
				if(tally >= minDevices){
					isSunlight = true; //boolean checking for if there is sunlight
				}
				
				if(isSunlight === true){
					if(this.chain[fromAddressBlockIndex].balance > amount){
						//transaction can occur
						this.chain[fromAddressBlockIndex].balance -= amount; //taking away money from the customer
						this.chain[toAddressBlockIndex].balance += amount; //sending the money to the solar producer
						console.log('Transaction was successful!');
					}
					else{
						console.log('There is not enough money from the customer for this transaction to take place!');
					}
				}
				else{
					console.log('There is no sunlight, so electricity cannot be sold');
				}
			}
		}
		else{
			console.log('Either one or both addresses are invalid!');
		}
	}
	
	/**
	 * Retrieves the balance of a particular block
	 *
	 * @return              The set price to be sold by the blocks
	 */
	getBalance(address){
		return this.chain[address].balance;
	}
	
	/**
	 *  Prints all of the balances of the blocks within the blockchain
	 */
	printBalance(){
		for(let i = 0; i < this.chain.length; i++){
			console.log('Block Address [', this.chain[i].index , ']: ', this.chain[i].balance);
		}
	}
}

//SCRATCH WORK FOR DEMOING 
let solarCoin = new Blockchain();
console.log('Mining block 1...'); //creating block 1
solarCoin.addBlock(new Block(1, "20/07/2017", "30609", true, 40, 10, 100));
console.log('Is this chain valid?', solarCoin.isChainValid()); //testing for validity

console.log('\nMining block 2...'); //creating block 2
solarCoin.addBlock(new Block(2, "21/07/2017", "30609", true, 40, 23, 150));
console.log('Is this chain valid?', solarCoin.isChainValid()); //testing for validity

console.log('\nMining block 3...'); //creating block 3
solarCoin.addBlock(new Block(3, "23/07/2017", "30609", true, 60, 12, 250));
console.log('Is this chain valid?', solarCoin.isChainValid()); //testing for validity

//setting the price for the transaction
//var solarPrice = 20; // dummy value for testing
var solarPrice = solarCoin.calculatePrice(); //calculating for solar prices
console.log('\nSolar Price: ', solarPrice);

console.log('\nBalance of all Blocks before Transaction#1: '); //starting balance before transaction 1
solarCoin.printBalance();
console.log('Transaction#1: '); //transaction 1
solarCoin.makeTransaction(1,2,solarPrice);
console.log('Current Balance of all Blocks after Transaction#1: '); //current balance before transaction 1
solarCoin.printBalance();

console.log('\nBalance of all Blocks before Transaction#2: '); //starting balance before transaction 2
solarCoin.printBalance();
console.log('Transaction#2: '); //transaction 2
solarCoin.makeTransaction(1,3,solarPrice);
console.log('Current Balance of all Blocks after Transaction#2: '); //current balance before transaction 2
solarCoin.printBalance();