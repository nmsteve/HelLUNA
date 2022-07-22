
const { expect } = require("chai");
const { ethers } = require("hardhat");
const { utils } = require("ethers");
require("dotenv").config();
  
  
  describe("HellLUNA Testing", function () {

     before(async function () {

      //get signers
      [owner, addr1, addr2, addr3, addr4, addr5,addr6,addr7,addr8,addr9,...addrs] = await ethers.getSigners();
      
      //get contract factory
      this.BEP20 = await ethers.getContractFactory("BEP20Token")
      this.HellLUNA =  await ethers.getContractFactory("HellLUNA");
      this.VAS = await ethers.getContractFactory("VAS");

      //Deploy BEP20 
     this.BEP20 = await this.BEP20.deploy()
     this.VAS = await this.VAS.deploy('VAS Rewards', 'VAS', BigInt(10**7*10**18))
     this.HellLUNA = await this.HellLUNA.deploy(process.env.ROUTER02, addr1.address, addr2.address)
      
      //get deployed instance
      await this.VAS.deployed()
      await this.BEP20.deployed()
      await this.HellLUNA.deployed()
      
      //set provider 
      this.provider = ethers.provider;

       //set defaultPair
       this.pairAddress = this.HellLUNA.defaultPair()
       this.pair = new ethers.Contract(
           this.pairAddress,
           ['function totalSupply() external view returns (uint)','function balanceOf(address owner) external view returns (uint)','function approve(address spender, uint value) external returns (bool)','function decimals() external pure returns (uint8)','function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)'],
           this.provider
       )
       this.pairsigner =this.pair.connect(owner)


      //set Router
      this.router02 = new ethers.Contract(
      process.env.ROUTER02,
      ['function swapExactETHForTokensSupportingFeeOnTransferTokens( uint amountOutMin,address[] calldata path,address to,uint deadline) external payable','function WETH() external pure returns (address)','function addLiquidityETH(address token, uint amountTokenDesired, uint amountTokenMin, uint amountETHMin, address to, uint deadline) external payable returns (uint amountToken, uint amountETH, uint liquidity)', 'function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable returns (uint[] memory amounts)', 'function swapExactTokensForETH(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)', 'function swapExactTokensForETHSupportingFeeOnTransferTokens( uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external','function removeLiquidityETHSupportingFeeOnTransferTokens( address token,uint liquidity,uint amountTokenMin,uint amountETHMin,address to,uint deadline) external returns (uint amountETH)'], 
      this.provider);
      this.routersigner = this.router02.connect(owner)


      //Top ETH 
      await network.provider.send("hardhat_setBalance", [ owner.address, '0x1431E0FAE6D7217CAA0000000'])
      await network.provider.send("hardhat_setBalance", [ addr5.address, '0x1431E0FAE6D7217CAA0000000'])
     

      //await this.HellLUNA.transferOwnership(addr3.address)
      //expect(await this.HellLUNA.owner()).to.be.equal(addr3.address)

      //await expect(this.HellLUNA.excludeFromFees(addr3.address, true)).to.be.revertedWith('Ownable: caller is not the owner')
      //await this.HellLUNA.connect(addr3).excludeFromFees(addr3.address, true)

      this.initialLiquidty = 2*(10**6)*(10**9)
      this.ethLiquidity = 2*(10**3)*(10**9)
     
       //add liquidty WETH-HellLUNA of addr3
     // await this.HellLUNA.transfer(addr3.address, this.initialLiquidty)
      //await this.HellLUNA.connect(addr3).approve(process.env.ROUTER02, this.initialLiquidty);
      //this.routersigner = this.router02.connect(addr3)

      //console.log('         Bal of addr3:', await this.HellLUNA.balanceOf(addr3.address)/10**9)
      //console.log('         allowance of addr3:', await this.HellLUNA.allowance(addr3.address, process.env.ROUTER02)/10**9)
      
      await this.HellLUNA.approve(process.env.ROUTER02, this.initialLiquidty);
      await this.routersigner.addLiquidityETH(
        this.HellLUNA.address,
        this.initialLiquidty,
        0,
        0,
        owner.address,
        Math.floor(Date.now() / 1000) + 60 * 20,
        {value : 2000*10**9}
        )

        
       const  reserve =  await this.pairsigner.getReserves()
       //const  {0:LUNAH,1:ETH} =  await this.pairsigner.getReserves()

        console.log(`\n           LUNAH Reserve:${reserve[0]}\n           ETH Reserve:${reserve[1]/10**9} \n           HullLUNA bal: ${await this.HellLUNA.balanceOf(this.HellLUNA.address)/10**9}\n            Owner Bal: ${await this.HellLUNA.balanceOf(owner.address)}`)

        
       
     });

   
    describe("Transfer:Among token holders", function () {

        it("Transfers with no fee ", async function () {

          //await this.HellLUNA.connect(addr3).transferOwnership(owner.address)
          // Transfer 50 tokens from owner to addr1
          const amount = 50*10**9
          const supply = await this.HellLUNA.totalSupply()
          const ownerBalance = await this.HellLUNA.balanceOf(owner.address);
  
          await this.HellLUNA.transfer(addr1.address,amount );
          const addr1Balance = await this.HellLUNA.balanceOf(addr1.address);
          expect(addr1Balance).to.equal(amount);
  
          // Transfer 50 tokens from addr1 to addr2
          // We use .connect(signer) to send a transaction from another account
          await this.HellLUNA.connect(addr1).transfer(addr2.address, amount);
          const addr2Balance = await this.HellLUNA.balanceOf(addr2.address);
          expect(addr2Balance).to.equal(amount);
  
          //Treansfer back to owner 
          await this.HellLUNA.connect(addr2).transfer(owner.address, amount);
          const _ownerBalance = await this.HellLUNA.balanceOf(owner.address);
          expect(ownerBalance).to.equal(_ownerBalance);
  
        });

        it('Does allow owner to send more than maxwallentToken amount', async function(){
          //Transfer from owner to addr4  more than 20M (expect addr4bal == 0
          await expect(this.HellLUNA.transfer(addr4.address, BigInt(30 * (10**6) * (10**9)))).to.be.revertedWith('HellLUNAH: Exceeds maximum wallet token amount')
          expect(await this.HellLUNA.balanceOf(addr4.address)).to.be.equals(0)

       });

        it('Should allow owner to receive more than maxwallentToken amount', async function(){
          //check the maxmum wallent token amount (expect == 20M)
         const maxBal = await this.HellLUNA.maxWalletToken()
         expect(maxBal).to.be.equal(BigInt(20 * (10**6) * (10**9)))
         const ownerBal = await this.HellLUNA.balanceOf(owner.address)

         const transferAMount = BigInt(10 * (10**6) * (10**9))

         //Transfer from owner to addr4, 5, 6  more than 20M (expect addrbal == 10M)
         await this.HellLUNA.transfer(addr4.address, transferAMount)
         expect(await this.HellLUNA.balanceOf(addr4.address)).to.be.equals(transferAMount)

         await this.HellLUNA.transfer(addr5.address, transferAMount)
         expect(await this.HellLUNA.balanceOf(addr5.address)).to.be.equals(transferAMount)

         await this.HellLUNA.transfer(addr6.address, transferAMount)
         expect(await this.HellLUNA.balanceOf(addr6.address)).to.be.equals(transferAMount)
         

        //     //Transfer back to owner
        await this.HellLUNA.connect(addr4).transfer(owner.address, transferAMount)
        await this.HellLUNA.connect(addr5).transfer(owner.address, transferAMount)
        await this.HellLUNA.connect(addr6).transfer(owner.address, transferAMount)

         expect(await this.HellLUNA.balanceOf(owner.address)).to.be.equals(ownerBal)

       });

        it('Should not allow other holders to send more than MaxWallentToken amount', async function(){
          //check the maxmum wallent token amount (expect == 20M)
         const maxBal = await this.HellLUNA.maxWalletToken()
         expect(maxBal).to.be.equal(BigInt(20 * (10**6) * (10**9)))
         const ownerBal = await this.HellLUNA.balanceOf(addr4.address)

         const transferAMount = BigInt(10 * (10**6) * (10**9))

         //Transfer from owner to addr4, 5, 6  more than 20M (expect addrbal == 10M)
         await this.HellLUNA.transfer(addr4.address, transferAMount)
         expect(await this.HellLUNA.balanceOf(addr4.address)).to.be.equals(transferAMount)

         await this.HellLUNA.transfer(addr5.address, transferAMount)
         expect(await this.HellLUNA.balanceOf(addr5.address)).to.be.equals(transferAMount)

         await this.HellLUNA.transfer(addr6.address, transferAMount)
         expect(await this.HellLUNA.balanceOf(addr6.address)).to.be.equals(transferAMount)
         

        //     //Transfer back to add7
        await this.HellLUNA.connect(addr4).transfer(addr7.address, transferAMount)
        await this.HellLUNA.connect(a580542139465728ddr5).transfer(addr7.address, transferAMount)
        await expect(this.HellLUNA.connect(addr6).transfer(addr7.address, transferAMount)).to.be.revertedWith('HellLUNAH: Exceeds maximum wallet token amount')

        // Transfer back to owner to reset for others tests
        await this.HellLUNA.connect(addr6).transfer(owner.address, transferAMount)
        await this.HellLUNA.connect(addr7).transfer(owner.address, transferAMount)

        //expect bal is zero before next tests
        expect(await this.HellLUNA.balanceOf(addr1.address)).to.be.equals(0)
        expect(await this.HellLUNA.balanceOf(addr2.address)).to.be.equals(0)
        expect(await this.HellLUNA.balanceOf(addr3.address)).to.be.equals(0)
        expect(await this.HellLUNA.balanceOf(addr4.address)).to.be.equals(0)
        expect(await this.HellLUNA.balanceOf(addr5.address)).to.be.equals(0)
        expect(await this.HellLUNA.balanceOf(addr6.address)).to.be.equals(0)
        expect(await this.HellLUNA.balanceOf(addr7.address)).to.be.equals(0)
       


        })
        
      });


    describe('Swap, Liquidify, send fee', function() {

      it('should send fee ', async function () {


        const  reserve =  await this.pairsigner.getReserves()

       let reserveA = this.initialLiquidty//reserve[0]
       let  reserveB = this.ethLiquidity//reserve[1]

       async function amm(amountA) {

        rA = reserveA
        rB = reserveB

        const pairConstant = rA * rB
        
        reserveA = rA + amountA
        reserveB = pairConstant/reserveA

        const expectedB = rB -reserveB

        return expectedB 

       }
       
         //get balances before Fees swap and distribute
         const addr0Bal = await this.provider.getBalance(owner.address)
         const addr1Bal = await this.provider.getBalance(addr1.address)
         const addr2Bal = await this.provider.getBalance(addr2.address)
         const addr4Bal = await this.provider.getBalance(addr4.address)
         console.log('           ')
         console.log(`           addr4(Swap account) bal B4 Swap: ${addr4Bal}`)

       //Transfer 50,000 tokens from owner to addr3, 
        const swapAmount =  50*(10**3)*(10**9)

        await this.HellLUNA.transfer(addr3.address,  swapAmount)
        expect(await this.HellLUNA.balanceOf(addr3.address)).to.be.equal(swapAmount)
        
        //path
        const wETH = await this.routersigner.WETH()
        const path = [this.HellLUNA.address,wETH]

        //connect addr3 and approve token spending
      await this.HellLUNA.connect(addr3).approve(process.env.ROUTER02, swapAmount)

        //swap
      this.routersigner = await this.routersigner.connect(addr3)
      await this.routersigner.swapExactTokensForETHSupportingFeeOnTransferTokens(
        swapAmount,
        0,
        path,
        addr4.address,
        Math.floor(Date.now() / 1000) + 60 * 10,
      )

      //get bal after swap
        
        const _addr1Bal = await this.provider.getBalance(addr1.address)
        const _addr2Bal = await this.provider.getBalance(addr2.address)
        const _addr4Bal = await this.provider.getBalance(addr4.address)

        console.log(`           User1 bal Aft Swap: ${_addr4Bal}`)



      // Eth collected
       const fee = (this.initialLiquidty+ swapAmount)/10**10
       console.log('           fee collected:',fee)
      
      console.log('           Dev ETH Estimate:',await amm(fee*0.1))
      console.log('           Dev ETH Actual:',(_addr1Bal - addr1Bal)/10**9)
      console.log('           ')


      console.log('           Marketing ETH Estimate:',await amm((fee*0.6)))
      console.log('           Marketing ETH Actual:',(_addr2Bal - addr2Bal)/10**9)
      console.log('           ')
      
      const lETH = await amm(fee*0.15)
      console.log('           Liquidity ETH Estimate:',lETH)
      console.log('           Liquidity LP Estimate',Math.sqrt(this.ethLiquidity * this.initialLiquidty)/10**9)
      //console.log('           Liquidity LP Estimate',Math.sqrt(lETH * fee*0.15))
      console.log('           Liquidity LP Actual:', await this.pair.balanceOf(owner.address)/10**9)
      console.log('           ')


      console.log('           User1 ETH Estimate:',await amm(swapAmount)/10**9)
      console.log('           user1 ETH Actual:',(_addr4Bal - addr4Bal)/10**9 )
      console.log('           ')

      const {0:LUNAH,1:ETH } =  await this.pairsigner.getReserves()

      console.log(
        `                  LUNAH Reserve:${LUNAH/10**9}\n
                  ETH Reserve:${ETH/10**9}\n
                  HullLUNA ETH bal: ${await this.provider.getBalance(this.HellLUNA.address)/10**9}\n
                  HellLUNA LUNAH bal: ${await this.HellLUNA.balanceOf(this.HellLUNA.address)/10**9}\n
                  
       
      `)

      })

     }); 

    describe.only('Add liquidity addr(5)', function(){
        
       it('send LP', async function(){

       let reserveA = this.initialLiquidty//reserve[0]
       let  reserveB = this.ethLiquidity//reserve[1]

       async function amm(amountA) {

        rA = reserveA
        rB = reserveB

        const pairConstant = rA * rB
        
        reserveA = rA + amountA
        reserveB = pairConstant/reserveA

        const expectedB = rB -reserveB

        return expectedB 

       }
        //transfer 20M from owner to addr5
            const transferAMount =  ethers.utils.parseEther('0.02') //2 * (10**7) * (10**9)
            const ethLiquidity = 20000*10**9

            await this.HellLUNA.transfer(addr5.address, transferAMount)
            expect(await this.HellLUNA.balanceOf(addr5.address)).to.be.equals(transferAMount)

            //reverts trying to transfer more
            await expect(this.HellLUNA.transfer(addr5.address, transferAMount)).to.be.revertedWith('HellLUNAH: Exceeds maximum wallet token amount')


            
              //add liquidty WETH-HellLUNA of addr5
        
          await this.HellLUNA.connect(addr5).approve(process.env.ROUTER02, transferAMount);
          this.routersigner = this.router02.connect(addr5)

          console.log('          Bal of addr5:', await this.HellLUNA.balanceOf(addr5.address)/10**9)
          console.log('          allowance of addr5:', await this.HellLUNA.allowance(addr5.address, process.env.ROUTER02)/10**9)

          //get balances before Fees swap and distribute
         const addr0Bal = await this.provider.getBalance(owner.address)
         const addr1Bal = await this.provider.getBalance(addr1.address)
         const addr2Bal = await this.provider.getBalance(addr2.address)
         const addr5Bal = await this.provider.getBalance(addr5.address)
          
            //add!
          await this.HellLUNA.approve(process.env.ROUTER02, transferAMount);
          await this.routersigner.addLiquidityETH(
            this.HellLUNA.address,
            transferAMount,
            0,
            0,
            addr5.address,
            Math.floor(Date.now() / 1000) + 60 * 20,
            {value : ethLiquidity}
            )

             //get balances after Fees swap and distribute
         const liquidity = await this.pair.balanceOf(owner.address)
         const _addr0Bal = await this.provider.getBalance(owner.address)
         const _addr1Bal = await this.provider.getBalance(addr1.address)
         const _addr2Bal = await this.provider.getBalance(addr2.address)
         const _addr5Bal = await this.provider.getBalance(addr5.address)
         const _addr5LUNAH = await this.HellLUNA.balanceOf(addr5.address)

        
            
        const  {0:LUNAH,1:ETH} =  await this.pairsigner.getReserves()

        console.log(`\n           LUNAH Reserve:${LUNAH}\n           ETH Reserve:${ETH/10**9} \n           HullLUNA bal: ${await this.HellLUNA.balanceOf(this.HellLUNA.address)/10**9}\n            Owner Bal: ${await this.HellLUNA.balanceOf(owner.address)}`)
        // Eth collected
       const fee = (transferAMount - _addr5LUNAH)/10**10
       console.log('           fee collected:',fee)
      
      console.log('           Dev ETH Estimate:',await amm(fee*0.1))
      console.log('           Dev ETH Actual:',(_addr1Bal - addr1Bal)/10**9)
      console.log('           ')


      console.log('           Marketing ETH Estimate:',await amm((fee*0.6)))
      console.log('           Marketing ETH Actual:',(_addr2Bal - addr2Bal)/10**9)
      console.log('           ')
      
      const lETH = await amm(fee*0.15)
      console.log('           Liquidity ETH Estimate:',lETH)
      console.log('           Liquidity LP Estimate',Math.sqrt(lETH * fee*0.15))
      console.log('           Liquidity LP Actual:', (await this.pair.balanceOf(owner.address))/10**9)
      console.log('           ')

     const  LUNAHBal = transferAMount - _addr5LUNAH 
     const ethbal = addr5Bal - _addr5Bal
     //console.log('           ', LUNAHBal, ethbal)
      console.log('           addr5 LP Estimate',Math.sqrt(LUNAHBal * ethbal)/10**9)
      console.log('           addr5 LP Actual:', (await this.pair.balanceOf(addr5.address))/10**9)
      console.log('           addr5 HulLUNA bal:', (await this.HellLUNA.balanceOf(addr5.address))/10**9)
      console.log('           ')
        

       })
    })

  })
