//create a pool instance
const { ethers } = require("ethers");
const provider = new ethers.providers.JsonRpcProvider('https://mainnet.infura.io/v3/dd952cde35f0408a90bfe7ac700d125b');
const { Pool, TickListDataProvider, Tick, Trade, Route } = require("@uniswap/v3-sdk");
const { Token, CurrencyAmount, Percent } = require("@uniswap/sdk-core");
const UniswapV3Router = require ("@uniswap/v3-periphery/artifacts/contracts/interfaces/ISwapRouter.sol/ISwapRouter.json")

//need to sign transactions replace for env variable
const signer = new ethers.Wallet.createRandom();
const account = signer.connect(provider);


const poolAddress = "0x8ad599c3A0ff1De082011EFDDc58f1908eb6e6D8";
const UniswapV3Pool = require("@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json");
poolContract = new ethers.Contract(poolAddress, UniswapV3Pool.abi, provider);

const routerAddress = "0xE592427A0AEce92De3Edee1F18E0157C05861564";
const routerContract = new ethers.Contract(routerAddress, UniswapV3Router.abi, provider);

//connect contract to account
const uniswapRouter = routerContract.connect(account);

const chainId = 1;

//pool addresses
const usdcAddress = "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48";
const wethAddress = "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2";

//token addresses
const token0 = new Token(chainId, usdcAddress, 6, "USDC", "USD COIN");
const token1 = new Token(chainId, wethAddress, 18, "WETH", "Wrapped Ether");


async function createPool() {
    const poolFee = await poolContract.fee();
    const slot0 = await poolContract.slot0();
    const poolPrice = slot0[0];
    const poolLiquidity= await poolContract.liquidity();
    const poolTick = slot0[1];

    const spacing = await poolContract.tickSpacing();

    const nearestTick = Math.floor(slot0[1] / spacing) * spacing;

    // the sum of these needs to be equal to zero - the dao is empty
    const tickLowerIndex = nearestTick - (60 * 100); // make this variable
    const tickUpperIndex = nearestTick + (60 * 100); //make this variable

    const tickLowerData = await poolContract.ticks(tickLowerIndex);
    const tickUpperData = await poolContract.ticks(tickUpperIndex);

    const lowerBound = new Tick({
        index: tickLowerIndex,
        liquidityGross: tickLowerData.liquidityGross,
        liquidityNet: tickLowerData.liquidityNet

    })

    const upperBound = new Tick({
        index: tickUpperIndex,
        liquidityGross: tickUpperData.liquidityGross,
        liquidityNet: tickUpperData.liquidityNet

    })
    
    const tickList = new TickListDataProvider([lowerBound, upperBound], spacing);

    console.log("upperBound", upperBound);
    console.log("lowerBound", lowerBound);

    const pool = new Pool(
        token0,
        token1,
        poolFee,
        poolPrice,
        poolLiquidity,
        poolTick,
        tickList
    )
    console.log("pool", pool);

    return pool;
}

async function  swapforWeth(_amount) {

    const deadline = Math.floor(Date.now() / 1000) + 60 * 5; // 5 minute deadline
    const amountIn = CurrencyAmount.fromRawAmount(token0, _amount);
    const _pool = await createPool();

    //ability to add more pools, can just pass an array
    const route = new Route([_pool], token0, token1);
    console.log(`1 USDC can be swapped for ${route.midPrice.toSignificant(6)} WETH`);
    console.log(`1 WETH can be swapped for ${route.midPrice.invert().toSignificant(6)} USDC`)

    //define slippage tolerance - try to factor in impermanent loss calculation
    const slippageTolerance = new Percent('50', '10000'); 

    const trade = await Trade.exactIn( route, amountIn);
    const amountOutMinimum = trade.minimumAmountOut(slippageTolerance);
    console.log(`For 1k usd you can get a minimum of ${amountOutMinimum.toSignificant(6)} WETH`);


    // //swap 1000 usdc for weth
    const swapParams = {
        path: Buffer.from([usdcAddress, wethAddress]),
        recipient: signer.address,
        deadline: deadline,
        amountIn: ethers.utils.parseUnits(amountIn.toExact(), 6),
        amountOutMinimum: ethers.utils.parseUnits(amountOutMinimum.toExact(), 18)
    }

    //use chainlink to query gasPrice
    const swapTx = uniswapRouter.exactInput(
        swapParams,
        {value: _amount, gasPrice: 20e9 }
    )

    console.log(`transaction: ${swapTx.hash}`);
    const swapReceipt = await swapTx.wait();
    console.log(`Swap Transaction Receipt: ${swapReceipt}`);

}

//provide liquidty and get an nft
async function addLiquidity() {

}



swapforWeth("1000000000");
