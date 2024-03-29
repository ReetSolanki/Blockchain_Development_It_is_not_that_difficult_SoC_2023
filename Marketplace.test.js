const Marketplace = artifacts.require('./Marketplace.sol')

require('chai')
 .use(require('chai-as-promised'))
 .should()

contract('Marketplace', ([deployer, seller, buyer]) => {
  let marketplace

  before(async () => {
   marketplace = await Marketplace.deployed()        // JavaScript is gonna continue code excecution while deploy is still being called(it doesn't wait for this function to finish), but with await it does wait for the function to be finished and then it continues code excecution
  })

  describe('deployment', async () => {
    it('deploys successfully', async () => {
    const address = await marketplace.address
    assert.notEqual(address, 0x0)   
    assert.notEqual(address, '')
    assert.notEqual(address, null)
    assert.notEqual(address, undefined)
   })

   it('has a name', async () => {
    const name = await marketplace.name()
    assert.equal(name, 'Dapp University Marketplace')
   })
  })

  describe('products', async () => {
    let result, productCount

    before(async () => {
      result = await marketplace.createProduct('iPhone X', web3.utils.toWei('1', 'Ether'), {from: seller})  
      productCount = await marketplace.productCount()
     })

   it('creates produucts', async () => {
    // Success
    assert.equal(productCount, 1)
    const event = result.logs[0].args
    assert.equal(event.id.toNumber(), productCount.toNumber(), 'id is correct')
    assert.equal(event.name, 'iPhone X', 'name is correct')
    assert.equal(event.price, '1000000000000000000', 'price is correct')
    assert.equal(event.owner, seller,'owner is correct')
    assert.equal(event.purchased, false, 'purchase is correct')

    //Failue: Product must have a name
    await await marketplace.createProduct('', web3.utils.toWei('1', 'Ether'), {from: seller}).should.be.rejected;
    //Failue: Product must have a price
    await await marketplace.createProduct('iPhone X', 0, {from: seller}).should.be.rejected;
   })

   it('lists produucts', async () => {
    const product = await marketplace.products(productCount)
    assert.equal(product.id.toNumber(), productCount.toNumber(), 'id is correct')
    assert.equal(product.name, 'iPhone X', 'name is correct')
    assert.equal(product.price, '1000000000000000000', 'price is correct')
    assert.equal(product.owner, seller,'owner is correct')
    assert.equal(product.purchased, false, 'purchase is correct')
   })

   it('sells products', async () => {
    // Track the seller balance before purchase
    let oldSellerBalance
    oldSellerBalance = await web3.eth.getBalance(seller)
    oldSellerBalance = new web3.utils.BN(oldSellerBalance)

    // Success: Buyer makes purchase
    result = await marketplace.purchaseProduct(productCount, {from: buyer, value: web3.utils.toWei('1', 'Ether')})

    // Check logs
    const event = result.logs[0].args
    assert.equal(event.id.toNumber(), productCount.toNumber(), 'id is correct')
    assert.equal(event.name, 'iPhone X', 'name is correct')
    assert.equal(event.price, '1000000000000000000', 'price is correct')
    assert.equal(event.owner, buyer,'owner is correct')
    assert.equal(event.purchased, true, 'purchase is correct')

    // Check that seller received funds
    let newSellerBalance
    newSellerBalance = await web3.eth.getBalance(seller)
    newSellerBalance = new web3.utils.BN(newSellerBalance)

    let price 
    price = web3.utils.toWei('1', 'Ether')
    price = new web3.utils.BN(price)

    const exepectedBalance = oldSellerBalance.add(price)

    assert.equal(newSellerBalance.toString(), exepectedBalance.toString())

    // Failure: Tries to buy a product that does not exist, i.e., product must have a valid id
    await marketplace.purchaseProduct(99, {from: buyer, value: web3.utils.toWei('1', 'Ether')}).should.be.rejected;
    // Failure: Buyer tries to buy without enough ether
    await marketplace.purchaseProduct(productCount, {from: buyer, value: web3.utils.toWei('0.5', 'Ether')}).should.be.rejected;
    // Failure: Deployer tries to buy the product, i.e., product can't be purchased twice
    await marketplace.purchaseProduct(productCount, {from: deployer, value: web3.utils.toWei('1', 'Ether')}).should.be.rejected;
    // Failure: Buyer tries to buy again, i.e., buyer ca't be the seller
    await marketplace.purchaseProduct(productCount, {from: buyer, value: web3.utils.toWei('1', 'Ether')}).should.be.rejected;
     
   })
  })
})

