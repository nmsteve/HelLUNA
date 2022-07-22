# HellLUNA BUG

### BUG Reprodution:

Add liquidity of or more that `24*(10**3)*(10**9) LUNAH` from a Holder who is not the liquidity wallent.

````    
await this.HellLUNA.transferOwnership(addr5.address)
expect(await this.HellLUNA.owner()).to.be.equal(addr5.address)


//add liquidty WETH-HellLUNA of addr5
await this.HellLUNA.transfer(addr5.address, BigInt(10*(10**6)*(10**9)))
await this.HellLUNA.connect(addr5).approve(process.env.ROUTER02, BigInt(10*(10**6)*(10**9)));
this.routersigner = this.router02.connect(addr5)

console.log('         Bal of addr5:', await this.HellLUNA.balanceOf(addr5.address)/10**9)
console.log('         allowance of addr5:', await this.HellLUNA.allowance(addr5.address, process.env.ROUTER02)/10**9)

await this.routersigner.addLiquidityETH(
this.HellLUNA.address,
BigInt(24*(10**4)*(10**9)),
0,
0,
owner.address,
Math.floor(Date.now() / 1000) + 60 * 20,
{value : 2000*10**9}
)
````
 

### Error statement
``Error: cannot estimate gas; transaction may fail or may require manual gas limit [ See: https://links.ethers.org/v5-errors-UNPREDICTABLE_GAS_LIMIT ] (reason="VM Exception while processing transaction: reverted with reason string 'TransferHelper: TRANSFER_FROM_FAILED'" , ...
``

### Bug Cause:
We are adding liquidity that gives a fees  enough to trigger SwapAndLiquidfy.This becames a complex transation thus reverting with the Error messange above.

### Affected Code:
````
 function swapFeesIfAmountIsReached(address from, address to) private {
        uint256 contractTokenBalance = balanceOf(address(this));
        
        if (
            contractTokenBalance >= swapTokensAtAmount &&
            !isSwappingFees &&
            !automatedMarketMakerPairs[from] && // do not swap fees on buys
            from != liquidityWallet &&
            to != liquidityWallet
        ) {
            isSwappingFees = true;

            buyFeesCollected = (contractTokenBalance / (buyFeesCollected + sellFeesCollected)) * buyFeesCollected;
            sellFeesCollected = contractTokenBalance - buyFeesCollected;

            uint256 devTokens = (buyFeesCollected * buyDevFee) / buyTotalFees;
            devTokens += (sellFeesCollected * sellDevFee) / sellTotalFees;
            if (devTokens > 0) swapAndSendToFeeDev(devTokens);

            uint256 marketingTokens = (buyFeesCollected * buyMarketingFee) / buyTotalFees;
            marketingTokens += (sellFeesCollected * sellMarketingFee) / sellTotalFees;
            if (marketingTokens > 0) swapAndSendToFeeMarketing(marketingTokens);

            uint256 swapTokens = (buyFeesCollected * buyLiquidityFee) / buyTotalFees;
            swapTokens = (sellFeesCollected * sellLiquidityFee) / sellTotalFees;
            if (swapTokens > 0) swapAndLiquify(swapTokens);

            buyFeesCollected = 0;
            sellFeesCollected = 0;

            isSwappingFees = false;
        }
    }
````
### Solution
1. When not WL Owner should  add without triggering SwapAndLiquidify.
2. Disallow owner from sending more than maxWallent amount and make SwapAndLiquidify > Totalfee% * MaxWallent amount