const { strideProtoRegistry: stride050ProtoRegistry } = require("stridejs050");
//also tested with 0.4.4, same behaviour
const { strideProtoRegistry: stride041ProtoRegistry } = require("stridejs041");
const { Registry, decodeTxRaw } = require("@cosmjs/proto-signing");
const { fromBase64 } = require("@cosmjs/encoding");

const stride041Registry = new Registry(stride041ProtoRegistry);
const stride050Registry = new Registry(stride050ProtoRegistry);

const rpc = "https://stride-rpc.quantnode.tech";

const oldTxHash = "AD4AFAD12F0A47E99817754A4747D0E427DA388F6098FD08DFBDA4B4DE0A9893";
const newTxHash = "FBDEF077208C91910907B5BD7C747D11CF130407FE03A00B8855583640014D64";

const oldTypeUrl = "/Stridelabs.stride.stakeibc.MsgLiquidStake";
const newTypeUrl = "/stride.stakeibc.MsgLiquidStake";

(async () => {
    let oldTx = await fetchAndDecodeTx(`/tx?hash=0x${oldTxHash}`);
    let newTx = await fetchAndDecodeTx(`/tx?hash=0x${newTxHash}`);

    //successful
    try {
        let decoded = stride050Registry.decode(newTx.body.messages[0]);
        console.log("Decoding new namespace tx with stridejs@0.5.0 successful");
    } catch (e) {}

    //Cannot decode old tx with new version stridejs
    //error Unregistered type url: /Stridelabs.stride.stakeibc.MsgLiquidStake
    try {
        let decoded = stride050Registry.decode(oldTx.body.messages[0]);
    } catch (e) {
        console.log("Error decoding old namespace tx with stridejs@0.5.0 with error " + e.message);
    }

    //Cannot decode old tx with old version stridejs
    //error Unregistered type url: /Stridelabs.stride.stakeibc.MsgLiquidStake
    try {
        let decoded = stride041Registry.decode(oldTx.body.messages[0]);
    } catch (e) {
        console.log("Error decoding old namespace tx with stridejs@0.4.1 with error " + e.message);
    }

    //my solution - take oldTypeUrl and assign registry type from old stridejs
    try {
        let registry = new Registry();
        registry.register(oldTypeUrl, stride041ProtoRegistry.find(x => x[0] === newTypeUrl)?.[1])

        let oldMsg = oldTx.body.messages[0];
        let decoded = registry.decode({ typeUrl: oldTypeUrl, value: oldMsg.value });
        console.log("Decoding old tx with handler from stridejs@0.4.1 successful");
    } catch (e) {}
})();

async function fetchAndDecodeTx(url) {
    let response = await fetch(`${rpc}${url}`);
    let data = await response.json();

    return decodeTxRaw(Buffer.from(fromBase64(data.result.tx)))
} 