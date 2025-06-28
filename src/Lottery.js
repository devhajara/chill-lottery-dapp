import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
// src/Lottery.tsx
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
const BACKEND_URL = "https://chill-and-win.up.railway.app";
export default function Lottery() {
    const { connection } = useConnection();
    const { publicKey, sendTransaction } = useWallet();
    const [lottery, setLottery] = useState(null);
    const [winners, setWinners] = useState([]);
    const [loading, setLoading] = useState(false);
    // Fetch current lottery
    useEffect(() => {
        const fetchLottery = async () => {
            try {
                const res = await axios.get(`${BACKEND_URL}/lottery`);
                setLottery(res.data);
            }
            catch {
                toast.error("❌ Failed to fetch lottery data");
            }
        };
        const fetchWinners = async () => {
            try {
                const res = await axios.get(`${BACKEND_URL}/winners`);
                setWinners(res.data);
            }
            catch {
                toast.error("❌ Failed to fetch winners");
            }
        };
        fetchLottery();
        fetchWinners();
    }, []);
    const handleEnterLottery = useCallback(async () => {
        if (!publicKey || !lottery) {
            toast.warn("⚠️ Connect wallet or wait for lottery to load");
            return;
        }
        try {
            setLoading(true);
            // Check if already entered
            const existing = await axios.get(`${BACKEND_URL}/entries/${lottery.id}`);
            const hasEntered = existing.data.some((e) => e.wallet === publicKey.toBase58());
            if (hasEntered) {
                toast.info("🎟️ You’ve already entered this lottery.");
                setLoading(false);
                return;
            }
            // Send SOL
            const transaction = new Transaction().add(SystemProgram.transfer({
                fromPubkey: publicKey,
                toPubkey: new PublicKey(lottery.lotteryWallet),
                lamports: lottery.entryFee,
            }));
            const signature = await sendTransaction(transaction, connection);
            await connection.confirmTransaction(signature, "confirmed");
            // Register on backend
            await axios.post(`${BACKEND_URL}/entry`, {
                wallet: publicKey.toBase58(),
                lotteryId: lottery.id,
            });
            toast.success("✅ Entry successful!");
        }
        catch (err) {
            toast.error(`❌ Transaction failed: ${err.message}`);
        }
        finally {
            setLoading(false);
        }
    }, [connection, publicKey, sendTransaction, lottery]);
    return (_jsxs("div", { style: { padding: 20, maxWidth: 500, margin: "0 auto" }, children: [_jsx("h2", { children: "\uD83C\uDF9F\uFE0F Chill & Win Lottery" }), lottery ? (_jsxs(_Fragment, { children: [_jsxs("p", { children: [_jsx("strong", { children: "Name:" }), " ", lottery.name] }), _jsxs("p", { children: [_jsx("strong", { children: "Entry Fee:" }), " ", lottery.entryFee / 1e9, " SOL"] }), _jsxs("p", { children: [_jsx("strong", { children: "Start:" }), " ", new Date(lottery.startDate).toLocaleString()] }), _jsxs("p", { children: [_jsx("strong", { children: "End:" }), " ", new Date(lottery.endDate).toLocaleString()] }), _jsx("button", { onClick: handleEnterLottery, disabled: !publicKey || loading, children: loading ? "Processing..." : "Enter Lottery" })] })) : (_jsx("p", { children: "Loading lottery info..." })), _jsx("hr", {}), _jsx("h3", { children: "\uD83C\uDFC6 Past Winners" }), winners.length > 0 ? (_jsx("ul", { children: winners.slice(0, 5).map((winner, idx) => (_jsxs("li", { children: [winner.wallet.slice(0, 4), "...", winner.wallet.slice(-4), " \u2014", " ", new Date(winner.createdAt).toLocaleDateString()] }, idx))) })) : (_jsx("p", { children: "No winners yet" }))] }));
}
