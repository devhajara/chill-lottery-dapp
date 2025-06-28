const API_BASE_URL = import.meta.env.VITE_BACKEND_URL; // Your backend URL

export async function getCurrentLottery() {
    const res = await fetch(`${API_BASE_URL}/api/lottery`);
    return res.json();
}

export async function createLottery(data: {
    entryFee: number;
    duration: number;
    numWinners: number;
}) {
    const res = await fetch(`${API_BASE_URL}/api/lottery`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    return res.json();
}

export async function enterLottery(publicKey: string, lotteryId: string) {
    const res = await fetch(`${API_BASE_URL}/api/entry`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wallet: publicKey, lotteryId }),
    });
    return res.json();
}

export async function getEntries(lotteryId: string) {
    const res = await fetch(`${API_BASE_URL}/api/entries/${lotteryId}`);
    return res.json();
}

export async function getWinners() {
    const res = await fetch(`${API_BASE_URL}/api/winners`);
    return res.json();
}

export async function declareWinner(lotteryId: string) {
    const res = await fetch(`${API_BASE_URL}/api/winner`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lotteryId }),
    });
    return res.json();
}
