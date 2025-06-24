// src/Lottery.tsx
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const BACKEND_URL = "https://chill-and-win.up.railway.app";

interface LotteryConfig {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  entryFee: number;
  lotteryWallet: string;
}

interface Winner {
  wallet: string;
  lotteryId: number;
  createdAt: string;
}

export default function Lottery() {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();

  const [lottery, setLottery] = useState<LotteryConfig | null>(null);
  const [winners, setWinners] = useState<Winner[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch current lottery
  useEffect(() => {
    const fetchLottery = async () => {
      try {
        const res = await axios.get(`${BACKEND_URL}/lottery`);
        setLottery(res.data);
      } catch {
        toast.error("❌ Failed to fetch lottery data");
      }
    };

    const fetchWinners = async () => {
      try {
        const res = await axios.get(`${BACKEND_URL}/winners`);
        setWinners(res.data);
      } catch {
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
      const existing = await axios.get(
        `${BACKEND_URL}/entries/${lottery.id}`
      );
      const hasEntered = existing.data.some(
        (e: any) => e.wallet === publicKey.toBase58()
      );
      if (hasEntered) {
        toast.info("🎟️ You’ve already entered this lottery.");
        setLoading(false);
        return;
      }

      // Send SOL
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: new PublicKey(lottery.lotteryWallet),
          lamports: lottery.entryFee,
        })
      );

      const signature = await sendTransaction(transaction, connection);
      await connection.confirmTransaction(signature, "confirmed");

      // Register on backend
      await axios.post(`${BACKEND_URL}/entry`, {
        wallet: publicKey.toBase58(),
        lotteryId: lottery.id,
      });

      toast.success("✅ Entry successful!");
    } catch (err) {
      toast.error(`❌ Transaction failed: ${(err as Error).message}`);
    } finally {
      setLoading(false);
    }
  }, [connection, publicKey, sendTransaction, lottery]);

  return (
    <div style={{ padding: 20, maxWidth: 500, margin: "0 auto" }}>
      <h2>🎟️ Chill & Win Lottery</h2>

      {lottery ? (
        <>
          <p><strong>Name:</strong> {lottery.name}</p>
          <p><strong>Entry Fee:</strong> {lottery.entryFee / 1e9} SOL</p>
          <p><strong>Start:</strong> {new Date(lottery.startDate).toLocaleString()}</p>
          <p><strong>End:</strong> {new Date(lottery.endDate).toLocaleString()}</p>

          <button onClick={handleEnterLottery} disabled={!publicKey || loading}>
            {loading ? "Processing..." : "Enter Lottery"}
          </button>
        </>
      ) : (
        <p>Loading lottery info...</p>
      )}

      <hr />

      <h3>🏆 Past Winners</h3>
      {winners.length > 0 ? (
        <ul>
          {winners.slice(0, 5).map((winner, idx) => (
            <li key={idx}>
              {winner.wallet.slice(0, 4)}...{winner.wallet.slice(-4)} —{" "}
              {new Date(winner.createdAt).toLocaleDateString()}
            </li>
          ))}
        </ul>
      ) : (
        <p>No winners yet</p>
      )}
    </div>
  );
}
