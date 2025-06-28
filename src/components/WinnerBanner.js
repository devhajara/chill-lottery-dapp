import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
const WinnerBanner = () => {
    const [winner, setWinner] = useState(null);
    const [dismissed, setDismissed] = useState(false);
    useEffect(() => {
        const lastWinner = JSON.parse(localStorage.getItem("lastWinner") || "null");
        if (lastWinner?.wallet) {
            setWinner(`${lastWinner.wallet.slice(0, 4)}...${lastWinner.wallet.slice(-4)}`);
        }
    }, []);
    if (!winner || dismissed)
        return null;
    const url = "https://chillandwin.xyz";
    const encodedUrl = encodeURIComponent(url);
    const message = encodeURIComponent(`🎉 I just won the Chill & Win Lottery as ${winner}! Try your luck 👉`);
    const shareLinks = [
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
    const handleCopy = () => {
        navigator.clipboard.writeText(url)
            .then(() => toast.success("🔗 Link copied!"))
            .catch(() => toast.error("❌ Failed to copy link."));
    };
    return (_jsxs("div", { style: {
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            background: "rgba(0, 0, 0, 0.7)",
            color: "white",
            padding: "10px 16px",
            zIndex: 9999,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "8px",
            fontSize: "14px",
        }, children: [_jsx("button", { onClick: () => setDismissed(true), style: {
                    position: "absolute",
                    top: "8px",
                    right: "16px",
                    background: "transparent",
                    border: "none",
                    color: "white",
                    fontSize: "18px",
                    cursor: "pointer",
                }, "aria-label": "Close", children: "\u274C" }), _jsxs("strong", { children: ["\uD83C\uDF89 ", winner, " just won Chill & Win Lottery!"] }), _jsxs("div", { style: { display: "flex", gap: "8px", flexWrap: "wrap" }, children: [shareLinks.map((link) => (_jsxs("a", { href: link.url, target: "_blank", rel: "noopener noreferrer", style: {
                            background: "#10b981",
                            borderRadius: "999px",
                            padding: "6px 12px",
                            color: "white",
                            textDecoration: "none",
                            fontWeight: "bold",
                        }, children: [link.icon, " Share on ", link.name] }, link.name))), _jsx("button", { onClick: handleCopy, style: {
                            background: "#facc15",
                            borderRadius: "999px",
                            padding: "6px 12px",
                            color: "#000",
                            fontWeight: "bold",
                            border: "none",
                            cursor: "pointer",
                        }, children: "\uD83D\uDCCB Copy Link" })] })] }));
};
export default WinnerBanner;
