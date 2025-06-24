import { useMemo, useState, useEffect } from "react";
import {
  ConnectionProvider,
  WalletProvider,
  useWallet
} from "@solana/wallet-adapter-react";
import {
  WalletModalProvider,
  WalletMultiButton
} from "@solana/wallet-adapter-react-ui";
import {
  PhantomWalletAdapter
} from "@solana/wallet-adapter-wallets";
import {
  PublicKey,
  SystemProgram,
  Transaction,
  Connection
} from "@solana/web3.js";
import Confetti from "react-confetti";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";


import "@solana/wallet-adapter-react-ui/styles.css";
import mascot from './assets/mascot.jpg';
import WinnerBanner from "./components/WinnerBanner";
import axios from 'axios';
// other imports...

// ✅ Paste here, just after imports and before any components





// ⬇️ Then comes your first component
// Removed duplicate App component declaration to fix redeclaration error

const RPC_URL = "https://mainnet.helius-rpc.com/?api-key=2a7a5dbd-6f5a-4f09-b31d-f8967b43ec9f";


const CountdownTimer = () => {
  const [timeLeft, setTimeLeft] = useState(0);
  const [endDate, setEndDate] = useState<number | null>(null);

  useEffect(() => {
    const fetchEndTime = async () => {
      try {
        const res = await fetch("https://chill-and-win.up.railway.app/lottery");
        const data = await res.json();
        const end = new Date(data.endDate).getTime();
        setEndDate(end);
      } catch (err) {
        console.error("Failed to fetch end time", err);
      }
    };

    fetchEndTime();
  }, []);

  useEffect(() => {
    if (!endDate) return;

    const updateCountdown = () => {
      const now = Date.now();
      setTimeLeft(Math.max(endDate - now, 0));
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [endDate]);

  if (timeLeft <= 0) return <p>🎯 New raffle starts soon!</p>;

  const seconds = Math.floor(timeLeft / 1000) % 60;
  const minutes = Math.floor(timeLeft / (1000 * 60)) % 60;
  const hours = Math.floor(timeLeft / (1000 * 60 * 60)) % 24;
  const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));

  return (
    <p style={{ marginTop: "1rem" }}>
      ⏳ Time left to enter: {days}d {hours}h {minutes}m {seconds}s
    </p>
  );
};


const LotterySection = () => {
  const { publicKey, connected, signTransaction } = useWallet();
  const [lottery, setLottery] = useState<any>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const isSunday = new Date().getUTCDay() === 0;

  useEffect(() => {
    const fetchLottery = async () => {
      try {
        const res = await fetch("https://chill-and-win.up.railway.app/lottery");
        const data = await res.json();
        setLottery(data);
      } catch (err) {
        setStatus("Failed to load lottery");
      }
    };

    fetchLottery();
  }, []);

  const handleEnter = async () => {
    if (!connected || !publicKey || !signTransaction || !lottery) {
      toast.warning("⚠️ Please connect your wallet first.");
      return;
    }

    if (isSunday) {
      toast.info("🛑 Entries are closed on Sunday.");
      return;
    }

    try {
      toast.info("⏳ Sending transaction...");
      const connection = new Connection(RPC_URL, "confirmed");

      const tx = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: new PublicKey(lottery.lotteryWallet),
          lamports: lottery.entryFee,
        })
      );

      const { blockhash } = await connection.getLatestBlockhash();
      tx.recentBlockhash = blockhash;
      tx.feePayer = publicKey;

      const signed = await signTransaction(tx);
      const sig = await connection.sendRawTransaction(signed.serialize());
      await connection.confirmTransaction(sig, "confirmed");

      await axios.post("https://chill-and-win.up.railway.app/entry", {
        wallet: publicKey.toBase58(),
        lotteryId: lottery.id,
      });

      toast.success("🎉 You're in! Good luck, degen.");
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 5000);
    } catch (e) {
      console.error(e);
      toast.error("❌ Transaction failed.");
    }
  };

  return (
    <div style={{ padding: "2rem", textAlign: "center", position: "relative" }}>
      {showConfetti && <Confetti width={window.innerWidth} height={window.innerHeight} recycle={false} numberOfPieces={300} />}
      <h1 style={{ fontSize: "2rem", marginBottom: "1rem" }}>Chill & Win Lottery</h1>

      {lottery ? (
        <>
          <p>🎯 Entry Fee: {(lottery.entryFee / 1e9).toFixed(3)} SOL</p>
          <p>🎟️ Ends: {new Date(lottery.endDate).toLocaleString()}</p>
          <button
            onClick={handleEnter}
            disabled={!connected || isSunday}
            style={{
              marginTop: "1rem",
              padding: "10px 20px",
              fontSize: "16px",
              cursor: connected && !isSunday ? "pointer" : "not-allowed",
              backgroundColor: connected && !isSunday ? "#10b981" : "#6b7280",
              border: "2px solid white",
              borderRadius: "8px",
              color: "white"
            }}
          >
            Enter Lottery
          </button>
        </>
      ) : (
        <p>Loading lottery info...</p>
      )}

      <CountdownTimer />
      <WinnerBanner />
    </div>
  );
};

const WinnersPage = () => {
  const [pastWinners, setPastWinners] = useState<string[]>([]);
  const [lastWinner, setLastWinner] = useState<{ wallet: string; timestamp: number } | null>(null);
  const [currentWinners, setCurrentWinners] = useState<string[]>([]);

  const fetchWinners = async () => {
    try {
      const res = await fetch("https://chill-and-win.up.railway.app/winners");
      const data = await res.json();

      setPastWinners(data.pastWinners || []);
      setCurrentWinners(data.currentWinners || []);
      setLastWinner(data.lastWinner || null);
    } catch (err) {
      console.error("Failed to fetch winners:", err);
    }
  };

  useEffect(() => {
    fetchWinners();
    window.addEventListener("winnersUpdated", fetchWinners);
    return () => {
      window.removeEventListener("winnersUpdated", fetchWinners);
    };
  }, []);

  return (
    <div style={{ padding: '2rem' }}>
      <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>🎯 Current Winner(s)</h2>
      {currentWinners.length ? (
        <ul>
          {currentWinners.map((addr, i) => (
            <li key={i} style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>
              🏆 {addr.slice(0, 4)}...{addr.slice(-4)}
            </li>
          ))}
        </ul>
      ) : <p>No winner selected yet.</p>}

      {lastWinner && (
        <div style={{ marginTop: '1rem', fontStyle: 'italic', color: '#ccc' }}>
          Last picked: {lastWinner.wallet.slice(0, 4)}...{lastWinner.wallet.slice(-4)} on{" "}
          {new Date(lastWinner.timestamp).toLocaleString()}
        </div>
      )}

      <h2 style={{ fontSize: '1.5rem', marginTop: '2rem' }}>📜 Past Winners</h2>
      {pastWinners.length ? (
        <ul style={{ marginTop: '0.5rem' }}>
          {pastWinners.map((addr, i) => (
            <li key={i} style={{ marginBottom: '0.25rem' }}>
              {addr.slice(0, 4)}...{addr.slice(-4)}
            </li>
          ))}
        </ul>
      ) : <p>No past winners yet.</p>}
    </div>
  );
};


const Dashboard = () => {
  const [entryFee, setEntryFee] = useState("...");
  const [duration, setDuration] = useState("...");
  const [numWinners, setNumWinners] = useState("...");
  const [loading, setLoading] = useState(true);

  const fetchSettings = async () => {
    try {
      const res = await fetch("https://chill-and-win.up.railway.app/lottery");
      const data = await res.json();

      setEntryFee(data.entryFee?.toString() || "N/A");
      setDuration(data.durationDays?.toString() || "N/A");
      setNumWinners(data.numWinners?.toString() || "N/A");
    } catch (err) {
      console.error("Error loading dashboard data", err);
      setEntryFee("N/A");
      setDuration("N/A");
      setNumWinners("N/A");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  if (loading) return <p style={{ padding: "2rem" }}>Loading dashboard...</p>;

  return (
    <div style={{ padding: "2rem", textAlign: "center" }}>
      <h2 style={{ fontSize: "2rem", marginBottom: "1rem" }}>📊 Lottery Dashboard</h2>
      <p>🎟 Entry Fee: <strong>{entryFee} SOL</strong></p>
      <p>📅 Duration: <strong>{duration} day(s)</strong></p>
      <p>🏆 Number of Winners: <strong>{numWinners}</strong></p>
    </div>
  );
};


const App = () => {
  const endpoint = useMemo(() => RPC_URL, []);
  const wallets = useMemo(() => [new PhantomWalletAdapter()], []);
  const [showSidebar, setShowSidebar] = useState(false);
  const [activePage, setActivePage] = useState("Enter Lottery");
  // Removed unused renderWinners function to fix "Cannot find name 'winners'" error.

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <div
            style={{
              position: 'relative',
              display: 'flex',
              minHeight: '100vh',
              width: '100vw',
              backgroundImage: `url(${mascot})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              overflow: 'hidden',
            }}
          >
            {/* Dark transparent overlay */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.6)', // dark overlay with 60% opacity
                zIndex: 0,
              }}
            />

            {/* Actual content */}
            <div style={{ position: 'relative', zIndex: 1, flexGrow: 1 }}>
              {/* Your sidebar, header, and main content go here */}
              {/* Keep your <aside> and <main> exactly as they are inside this div */}
              <aside style={{
                width: showSidebar ? '250px' : '0',
                transition: 'width 0.3s',
                background: 'rgba(0,0,0,0.85)',
                color: 'white',
                overflow: 'hidden',
                position: 'fixed',
                left: 0,
                top: 0,
                height: '100vh',
                zIndex: 100,
                boxShadow: showSidebar ? '2px 0 8px rgba(0,0,0,0.2)' : 'none',
                padding: showSidebar ? '2rem 1rem' : '0'
              }}>
                <button onClick={() => setShowSidebar(false)} style={{ float: 'right', fontSize: '1.2rem', background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>×</button>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: '2rem 0 1rem 0' }}>Menu</h2>
                <ul style={{ listStyle: 'none', padding: 0, lineHeight: '2', cursor: 'pointer' }}>
                  {['Dashboard', 'Enter Lottery', 'Winners', 'Admin'].map((item) => (
                    <li key={item} onClick={() => { setActivePage(item); setShowSidebar(false); }}>{item}</li>
                  ))}
                </ul>
              </aside>

              <main style={{ flexGrow: 1, padding: '2rem', width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: '1rem' }}>
                  <button onClick={() => setShowSidebar(true)} style={{ fontSize: '1.5rem', background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>☰</button>
                  <WalletMultiButton />
                </div>
                {activePage === "Enter Lottery" && <LotterySection />}
                {activePage === "Dashboard" && <Dashboard />}
                {activePage === "Winners" && <WinnersPage />}
                {activePage === "Admin" && <AdminPanel />}
                {["Enter Lottery", "Dashboard", "Winners", "Admin"].indexOf(activePage) === -1 && (
                  <div style={{ padding: "2rem" }}>{activePage} page under construction.</div>
                )}
              </main>
              <ShareButton />
            </div>
            <ToastContainer position="bottom-center" autoClose={3000} hideProgressBar={false} newestOnTop closeOnClick pauseOnHover theme="dark" />
          </div>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};
function AdminPanel() {
  const adminWallet = "GDfZ6f9ji2wYtd2b5ZXwJMZpcKQi5ECcB5Uzyftiyw8u"; // Replace with the actual admin wallet address
  const wallet = useWallet();
  const isAdmin = wallet?.publicKey?.toBase58() === adminWallet;

  const [entryFee, setEntryFee] = useState('0.001');
  const [drawDuration, setDrawDuration] = useState('7');
  const [numWinners, setNumWinners] = useState('1');
  const [promotionOn, setPromotionOn] = useState(false);
  const [lotteryActive, setLotteryActive] = useState(false);
  const [entries, setEntries] = useState<string[]>([]);
  const [pastWinners, setPastWinners] = useState<string[]>([]);
  const [timeLeft, setTimeLeft] = useState('');
  const [showManualPicker, setShowManualPicker] = useState(false);
  const [lotteryId, setLotteryId] = useState<number | null>(null);

  useEffect(() => {
    if (!isAdmin) return;

    const loadData = async () => {
      try {
        const res = await fetch("https://chill-and-win.up.railway.app/lottery");
        const data = await res.json();

        setEntryFee((data.entryFee / 1e9).toFixed(3));
        setDrawDuration(data.drawDuration?.toString() || "7");
        setNumWinners(data.numWinners?.toString() || "1");
        setLotteryId(data.id);

        const end = new Date(data.endDate).getTime();
        setLotteryActive(end > Date.now());

        // Entries
        const entryRes = await fetch(`https://chill-and-win.up.railway.app/entries/${data.id}`);
        const entryData = await entryRes.json();
        setEntries(entryData.map((e: any) => e.wallet));

        // Winners
        const winnerRes = await fetch(`https://chill-and-win.up.railway.app/winners`);
        const winnerData = await winnerRes.json();
        setPastWinners(winnerData.map((w: any) => w.wallet));

        // Countdown
        const updateCountdown = () => {
          const now = Date.now();
          if (!end || end <= now) {
            setTimeLeft("Ended");
            setLotteryActive(false);
            return;
          }

          const diff = end - now;
          const d = Math.floor(diff / (1000 * 60 * 60 * 24));
          const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
          const m = Math.floor((diff / (1000 * 60)) % 60);
          const s = Math.floor((diff / 1000) % 60);
          setTimeLeft(`${d}d ${h}h ${m}m ${s}s`);
        };

        updateCountdown();
        const interval = setInterval(updateCountdown, 1000);
        return () => clearInterval(interval);
      } catch (e) {
        console.error("Failed to load admin data", e);
      }
    };

    loadData();
  }, [isAdmin]);
  

  const startLottery = async () => {
    try {
      const durationDays = parseInt(drawDuration) || 7;
      const startDate = new Date();
      const endDate = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);

      const payload = {
        name: `Lottery - ${new Date().toLocaleDateString()}`,
        startDate,
        endDate,
        entryFee: Math.floor(parseFloat(entryFee) * 1e9), // Convert SOL to lamports
        lotteryWallet: adminWallet,
        autoPick: true,
        numWinners: parseInt(numWinners),
      };

      const res = await fetch("https://chill-and-win.up.railway.app/lottery", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to start lottery");

      toast.success("🎯 Lottery started!");
      setLotteryActive(true);
    } catch (error) {
      console.error("Start Lottery Error:", error);
      toast.error("❌ Failed to start lottery");
    }
  };
  
  const endLottery = async () => {
    try {
      const currentLotteryRes = await fetch("https://chill-and-win.up.railway.app/lottery");
      const currentLottery = await currentLotteryRes.json();

      if (!currentLottery || !currentLottery.id) {
        toast.error("No active lottery found.");
        return;
      }

      const winnersRes = await fetch(`https://chill-and-win.up.railway.app/winners?lotteryId=${currentLottery.id}`);
      const existingWinners = await winnersRes.json();

      if (existingWinners.length === 0) {
        toast.warning("No winners declared yet.");
      }

      toast.success("🏁 Lottery ended!");
      setLotteryActive(false);
      setTimeLeft("Ended");
    } catch (error) {
      console.error("End Lottery Error:", error);
      toast.error("❌ Failed to end lottery");
    }
  };
  

  const pickWinners = async () => {
    try {
      const currentLotteryRes = await fetch("https://chill-and-win.up.railway.app/lottery");
      const currentLottery = await currentLotteryRes.json();

      if (!currentLottery || !currentLottery.id) {
        toast.error("No active lottery found.");
        return;
      }

      const declareRes = await fetch("https://chill-and-win.up.railway.app/winner", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          lotteryId: currentLottery.id,
          // No manualWinners provided → backend will autoPick
        }),
      });

      const result = await declareRes.json();

      if (!declareRes.ok) {
        toast.error(result.error || "Failed to pick winners");
        return;
      }

      toast.success(`🎉 ${result.winners.length} winner(s) selected!`);
      window.dispatchEvent(new Event("winnersUpdated"));
    } catch (error) {
      console.error("Pick Winners Error:", error);
      toast.error("❌ Failed to declare winners");
    }
  };
  
  

  if (!isAdmin) return null;

  // Define a simple input style object
  const inputStyle: React.CSSProperties = {
    padding: '8px',
    borderRadius: '6px',
    border: '1px solid #ccc',
    fontSize: '16px',
    marginLeft: '10px',
    marginTop: '5px',
    width: '120px'
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1.5rem', textAlign: 'center' }}>🎯 Admin Panel</h1>

      {/* Stats Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '1rem',
          marginBottom: '2rem',
        }}
      >
        <InfoCard label="🎟 Total Entries" value={entries.length} color="green" />
        <InfoCard label="🏆 Total Winners" value={pastWinners.length} color="yellow" />
        <InfoCard label="📊 Entry Fee" value={`${entryFee} SOL`} color="blue" />
        <InfoCard label="⏱️ Countdown" value={timeLeft} color="purple" />
        <InfoCard label="📅 Duration" value={`${drawDuration} day${drawDuration !== '1' ? 's' : ''}`} color="pink" />
        <InfoCard label="🧮 No. of Winners" value={numWinners} color="red" />
      </div>

      {/* Form Controls */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
        <div>
          <label>🎟 Entry Fee (SOL)</label>
          <input
            value={entryFee}
            onChange={(e) => setEntryFee(e.target.value)}
            disabled={lotteryActive}
            style={inputStyle}
          />
        </div>
        <div>
          <label>📅 Draw Duration (Days)</label>
          <input
            value={drawDuration}
            onChange={(e) => setDrawDuration(e.target.value)}
            disabled={lotteryActive}
            style={inputStyle}
          />
        </div>
        <div>
          <label>🏆 Number of Winners</label>
          <input
            value={numWinners}
            onChange={(e) => setNumWinners(e.target.value)}
            disabled={lotteryActive}
            style={inputStyle}
          />
        </div>
        <div>
          <label>🎁 Special Promo</label>
          <input
            type="checkbox"
            checked={promotionOn}
            onChange={() => setPromotionOn(!promotionOn)}
            disabled={lotteryActive}
            style={{ marginLeft: '10px', transform: 'scale(1.2)' }}
          />
        </div>
      </div>

      {/* Action Buttons */}
      {/*
        Define button styles for consistent appearance.
      */}
      {(() => {
        const baseButtonStyle: React.CSSProperties = {
          padding: '10px 20px',
          borderRadius: '8px',
          border: 'none',
          color: 'white',
          fontWeight: 'bold',
          fontSize: '16px',
          cursor: 'pointer',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        };
        // Attach to window for use in JSX below
        (window as any).buttonStyleGreen = { ...baseButtonStyle, backgroundColor: '#10b981' };
        (window as any).buttonStyleRed = { ...baseButtonStyle, backgroundColor: '#ef4444' };
        (window as any).buttonStylePurple = { ...baseButtonStyle, backgroundColor: '#8b5cf6' };
        (window as any).buttonStyleYellow = { ...baseButtonStyle, backgroundColor: '#f59e0b', color: '#222' };
        return null;
      })()}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
        <button onClick={startLottery} disabled={lotteryActive} style={(window as any).buttonStyleGreen}>🚀 Start Lottery</button>
        <button onClick={endLottery} disabled={!lotteryActive} style={(window as any).buttonStyleRed}>🛑 End Lottery</button>
        <button onClick={pickWinners} disabled={lotteryActive} style={(window as any).buttonStylePurple}>🎰 Auto Pick Winners</button>
        <button onClick={() => setShowManualPicker(true)} disabled={lotteryActive} style={(window as any).buttonStyleYellow}>🧠 Manual Pick</button>
      </div>

      {/* Manual Picker Modal */}
      <ManualWinnerSelector isOpen={showManualPicker} onClose={() => setShowManualPicker(false)} />
    </div>

  );
}

interface InfoCardProps {
  label: string;
  value: string | number;
  color?: string;
}

const InfoCard = ({ label, value, color = "blue" }: InfoCardProps) => {
  const bgColor = {
    green: "#D1FAE5",
    yellow: "#FEF9C3",
    blue: "#DBEAFE",
    purple: "#EDE9FE",
    pink: "#FCE7F3",
    red: "#FECACA",
  }[color];

  return (
    <div
      style={{
        backgroundColor: bgColor || "#DBEAFE",
        padding: "1.2rem",
        borderRadius: "1rem",
        textAlign: "center",
        boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
      }}
    >
      <p style={{ fontSize: "14px", color: "#555", marginBottom: "0.5rem" }}>{label}</p>
      <h2 style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#111" }}>{value}</h2>
    </div>
  );
};

// export default InfoCard;





// Add ManualWinnerSelector component definition

interface ManualWinnerSelectorProps {
  isOpen: boolean;
  onClose: () => void;
}

const ManualWinnerSelector = ({ isOpen, onClose }: ManualWinnerSelectorProps) => {
  const { publicKey } = useWallet();
  const [entries, setEntries] = useState<string[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [lotteryId, setLotteryId] = useState<number | null>(null);

  useEffect(() => {
    if (!isOpen || !publicKey) return;

    const fetchLotteryAndEntries = async () => {
      try {
        const res = await fetch("https://chill-and-win.up.railway.app/lottery");
        const lottery = await res.json();
        setLotteryId(lottery.id);

        const entryRes = await fetch(`https://chill-and-win.up.railway.app/entries/${lottery.id}`);
        const data = await entryRes.json();
        setEntries(data.map((e: any) => e.wallet));
      } catch (err) {
        toast.error("❌ Failed to fetch entries.");
      }
    };

    fetchLotteryAndEntries();
  }, [isOpen, publicKey]);

  const handleSelect = (wallet: string) => {
    setSelected((prev) =>
      prev.includes(wallet) ? prev.filter((w) => w !== wallet) : [...prev, wallet]
    );
  };

  const handleConfirm = async () => {
    if (!lotteryId || selected.length === 0) {
      toast.error("Please select at least one winner.");
      return;
    }

    try {
      const res = await fetch("https://chill-and-win.up.railway.app/declare-winner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lotteryId,
          manualWinners: selected,
        }),
      });

      if (!res.ok) throw new Error("Failed to declare winners");

      toast.success(`🎉 Declared ${selected.length} winner(s)!`);
      onClose();
    } catch (err) {
      console.error("Manual Winner Error:", err);
      toast.error("❌ Failed to declare winners.");
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0, left: 0, width: "100%", height: "100%",
        background: "rgba(0, 0, 0, 0.6)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 1000,
      }}
    >
      <div style={{
        background: "#fff",
        padding: "2rem",
        borderRadius: "12px",
        maxHeight: "80%",
        overflowY: "auto",
        width: "400px",
      }}>
        <h2 style={{ marginBottom: "1rem" }}>🧠 Select Manual Winners</h2>
        {entries.length === 0 ? (
          <p>No entries available</p>
        ) : (
          <ul style={{ listStyle: "none", padding: 0 }}>
            {entries.map((wallet) => (
              <li key={wallet} style={{ marginBottom: "0.5rem" }}>
                <label>
                  <input
                    type="checkbox"
                    checked={selected.includes(wallet)}
                    onChange={() => handleSelect(wallet)}
                    style={{ marginRight: "0.5rem" }}
                  />
                  {wallet.slice(0, 4)}...{wallet.slice(-4)}
                </label>
              </li>
            ))}
          </ul>
        )}
        <div style={{ marginTop: "1rem", display: "flex", justifyContent: "space-between" }}>
          <button
            onClick={handleConfirm}
            style={{ backgroundColor: "#10b981", color: "white", padding: "8px 16px", borderRadius: "6px" }}
          >
            ✅ Confirm Winners
          </button>
          <button
            onClick={onClose}
            style={{ backgroundColor: "#ef4444", color: "white", padding: "8px 16px", borderRadius: "6px" }}
          >
            ❌ Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

// export default ManualWinnerSelector;

import { toast } from "react-toastify";

const ShareButton = () => {
  const [open, setOpen] = useState(false);

  const shareUrl = "https://chillandwin.xyz"; // 🔁 Update this to your actual URL
  const encodedUrl = encodeURIComponent(shareUrl);
  const message = encodeURIComponent("🎯 I'm playing Chill & Win Lottery! Join me and test your luck 🔥");

  const platforms = [
    {
      name: "X",
      icon: "🐦",
      url: `https://twitter.com/intent/tweet?text=${message}&url=${encodedUrl}`,
    },
    {
      name: "Telegram",
      icon: "📲",
      url: `https://t.me/share/url?url=${encodedUrl}&text=${message}`,
    },
    {
      name: "Discord",
      icon: "💬",
      url: `https://discord.com/channels/@me`,
    },
  ];

  return (
    <div style={{ position: 'fixed', bottom: '30px', right: '30px', zIndex: 1000 }}>
      {open && (
        <div style={{ marginBottom: '10px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {platforms.map((p) => (
            <a
              key={p.name}
              href={p.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                backgroundColor: '#10b981',
                color: 'white',
                padding: '10px 15px',
                borderRadius: '999px',
                textDecoration: 'none',
                boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {p.icon} &nbsp; Share via {p.name}
            </a>
          ))}

<button
            onClick={() => {
              navigator.clipboard.writeText(window.location.href)
                .then(() => {
                  toast.success("🔗 Link copied!");
                })
                .catch(() => {
                  toast.error("❌ Failed to copy link.");
                });
            }}
            style={{
              backgroundColor: '#14b8a6',
              color: 'white',
              padding: '10px 15px',
              borderRadius: '999px',
              border: 'none',
              fontWeight: 'bold',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
            }}
          >
            📋 Copy Link
          </button>

        </div>
      )}

      <button
        onClick={() => setOpen(!open)}
        style={{
          backgroundColor: '#f59e0b',
          color: 'white',
          border: 'none',
          padding: '14px 20px',
          borderRadius: '999px',
          cursor: 'pointer',
          boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
          fontSize: '16px',
          fontWeight: 'bold',
        }}
      >
        📤 Share
      </button>
    </div>
  );
};


export default App;


