const API_BASE_URL = "https://chill-backend-production.up.railway.app"; // Your backend URL
export async function getCurrentLottery() {
    const res = await fetch(`${API_BASE_URL}/lottery`);
    return res.json();
}
export async function createLottery(data) {
    const res = await fetch(`${API_BASE_URL}/lottery`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    return res.json();
}
export async function enterLottery(publicKey, lotteryId) {
    const res = await fetch(`${API_BASE_URL}/entry`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wallet: publicKey, lotteryId }),
    });
    return res.json();
}
export async function getEntries(lotteryId) {
    const res = await fetch(`${API_BASE_URL}/entries/${lotteryId}`);
    return res.json();
}
export async function getWinners() {
    const res = await fetch(`${API_BASE_URL}/winners`);
    return res.json();
}
export async function declareWinner(lotteryId) {
    const res = await fetch(`${API_BASE_URL}/winner`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lotteryId }),
    });
    return res.json();
}
