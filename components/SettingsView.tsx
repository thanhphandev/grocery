"use client";

import { motion } from "framer-motion";
import {
    CheckCircle2,
    Database,
    Download,
    FileSpreadsheet,
    Loader2,
    LogOut,
    Monitor,
    Moon,
    PieChart,
    Sun,
    Upload,
    User,
    Zap,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState, useEffect } from "react";
import { toast } from "sonner";
import useSWR from "swr";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { signOut, useSession } from "@/lib/auth-client";
import { AlertTriangle, Trash2 } from "lucide-react";

type ThemeMode = "light" | "dark" | "system";

interface SettingsViewProps {
    theme: ThemeMode;
    onThemeChange: (mode: ThemeMode) => void;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function SettingsView({ theme, onThemeChange }: SettingsViewProps) {
    const router = useRouter();
    const { data: session } = useSession();
    const { data } = useSWR("/api/products?q=", fetcher);
    const productCount = data?.total;
    const [signingOut, setSigningOut] = useState(false);

    const handleSignOut = async () => {
        setSigningOut(true);
        await signOut();
        router.replace("/login");
    };

    const [resetConfirm, setResetConfirm] = useState(false);
    const [isResetting, setIsResetting] = useState(false);

    const handleReset = async () => {
        if (!resetConfirm) {
            setResetConfirm(true);
            return;
        }

        setIsResetting(true);
        try {
            const res = await fetch("/api/reset", { method: "DELETE" });
            if (!res.ok) throw new Error("Reset failed");
            toast.success("Đã xóa toàn bộ dữ liệu hệ thống");
            setResetConfirm(false);
            // Reload page to reflect empty state
            window.location.reload();
        } catch {
            toast.error("Lỗi khi xóa dữ liệu");
        }
        setIsResetting(false);
    };

    // Auto-reset confirmation after 3s
    useEffect(() => {
        if (resetConfirm) {
            const t = setTimeout(() => setResetConfirm(false), 3000);
            return () => clearTimeout(t);
        }
    }, [resetConfirm]);

    const [exporting, setExporting] = useState(false);
    const [importing, setImporting] = useState(false);
    const [importResult, setImportResult] = useState<{
        imported: number;
        updated: number;
        errors?: string[];
    } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const themes: { mode: ThemeMode; icon: any; label: string }[] = [
        { mode: "light", icon: Sun, label: "Sáng" },
        { mode: "dark", icon: Moon, label: "Tối" },
        { mode: "system", icon: Monitor, label: "Hệ thống" },
    ];

    // ─── Export ───────────────────────────────────────────────
    const handleExport = async () => {
        setExporting(true);
        try {
            const res = await fetch("/api/products/export");
            if (!res.ok) throw new Error("Export failed");

            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `san-pham-${new Date().toISOString().slice(0, 10)}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            toast.success("Đã xuất file CSV");
        } catch {
            toast.error("Lỗi khi xuất dữ liệu");
        }
        setExporting(false);
    };

    // ─── Import ───────────────────────────────────────────────
    const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        e.target.value = ""; // Reset so same file can be re-selected

        setImporting(true);
        setImportResult(null);

        try {
            const text = await file.text();
            const res = await fetch("/api/products/import", {
                method: "POST",
                headers: { "Content-Type": "text/plain; charset=utf-8" },
                body: text,
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || "Import failed");
            }

            setImportResult({
                imported: data.imported || 0,
                updated: data.updated || 0,
                errors: data.errors,
            });

            toast.success(
                `Đã nhập ${data.imported} sản phẩm mới, cập nhật ${data.updated}`,
            );
        } catch (err: any) {
            toast.error(err.message || "Lỗi khi nhập dữ liệu");
        }
        setImporting(false);
    };

    return (
        <div className="space-y-4 pb-20">
            {/* User Account */}
            <Card>
                <CardContent className="p-4">
                    <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                        <User className="w-4 h-4 text-primary" />
                        Tài khoản
                    </h3>
                    <div className="flex items-center gap-3 p-3 bg-muted/40 rounded-xl mb-3">
                        {session?.user?.image ? (
                            <img
                                src={session.user.image}
                                alt="Avatar"
                                className="w-10 h-10 rounded-full ring-2 ring-primary/20"
                                referrerPolicy="no-referrer"
                            />
                        ) : (
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <User className="w-5 h-5 text-primary" />
                            </div>
                        )}
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-foreground truncate">
                                {session?.user?.name || "Người dùng"}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                                {session?.user?.email || ""}
                            </p>
                        </div>
                    </div>
                    <Button
                        variant="outline"
                        onClick={handleSignOut}
                        disabled={signingOut}
                        className="w-full h-11 rounded-xl gap-2 font-semibold text-sm text-destructive hover:text-destructive hover:bg-destructive/5 border-destructive/20"
                    >
                        {signingOut ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <LogOut className="w-4 h-4" />
                        )}
                        {signingOut ? "Đang đăng xuất..." : "Đăng xuất"}
                    </Button>
                </CardContent>
            </Card>

            {/* Theme switcher */}
            <Card>
                <CardContent className="p-4">
                    <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                        <Monitor className="w-4 h-4 text-primary" />
                        Giao diện
                    </h3>
                    <div className="grid grid-cols-3 gap-2">
                        {themes.map((t) => {
                            const Icon = t.icon;
                            return (
                                <motion.button
                                    type="button"
                                    key={t.mode}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => onThemeChange(t.mode)}
                                    className={`flex flex-col items-center justify-center gap-2 py-3 px-2 rounded-xl transition-all border ${theme === t.mode
                                        ? "bg-primary/5 border-primary text-primary shadow-sm"
                                        : "bg-card border-border hover:bg-muted/50 text-muted-foreground"
                                        }`}
                                >
                                    <Icon
                                        className={`w-5 h-5 ${theme === t.mode ? "fill-current" : ""}`}
                                    />
                                    <span className="text-xs font-medium">{t.label}</span>
                                </motion.button>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>

            {/* Import/Export */}
            <Card>
                <CardContent className="p-4">
                    <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                        <FileSpreadsheet className="w-4 h-4 text-primary" />
                        Nhập/Xuất dữ liệu
                    </h3>
                    <div className="grid grid-cols-2 gap-2 mb-3">
                        <Button
                            variant="outline"
                            onClick={handleExport}
                            disabled={exporting}
                            className="h-11 rounded-xl gap-2 font-semibold text-sm"
                        >
                            {exporting ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Download className="w-4 h-4" />
                            )}
                            {exporting ? "Đang xuất..." : "Xuất CSV"}
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={importing}
                            className="h-11 rounded-xl gap-2 font-semibold text-sm"
                        >
                            {importing ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Upload className="w-4 h-4" />
                            )}
                            {importing ? "Đang nhập..." : "Nhập CSV"}
                        </Button>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".csv,text/csv"
                            onChange={handleImport}
                            className="hidden"
                        />
                    </div>

                    {/* Import result */}
                    {importResult && (
                        <motion.div
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="p-3 bg-success/10 rounded-xl text-sm"
                        >
                            <div className="flex items-center gap-2 text-success font-semibold mb-1">
                                <CheckCircle2 className="w-4 h-4" />
                                Nhập liệu thành công
                            </div>
                            <div className="text-xs text-muted-foreground space-y-0.5">
                                <p>
                                    Mới:{" "}
                                    <span className="font-semibold text-foreground">
                                        {importResult.imported}
                                    </span>{" "}
                                    sản phẩm
                                </p>
                                <p>
                                    Cập nhật:{" "}
                                    <span className="font-semibold text-foreground">
                                        {importResult.updated}
                                    </span>{" "}
                                    sản phẩm
                                </p>
                                {importResult.errors && importResult.errors.length > 0 && (
                                    <div className="mt-1 pt-1 border-t border-border/50">
                                        <p className="text-destructive font-medium">Lỗi:</p>
                                        {importResult.errors.map((err, i) => (
                                            <p key={i} className="text-destructive/80">
                                                {err}
                                            </p>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}

                    <p className="text-[11px] text-muted-foreground mt-2">
                        File CSV phải có các cột: Mã vạch, Tên, Giá lẻ, Giá sỉ, Đơn vị, Vị
                        trí, Ảnh URL
                    </p>
                </CardContent>
            </Card>

            {/* Danger Zone */}
            <Card className="border-destructive/20 bg-destructive/5">
                <CardContent className="p-4">
                    <h3 className="text-sm font-semibold text-destructive mb-3 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" />
                        Vùng nguy hiểm
                    </h3>
                    <p className="text-xs text-muted-foreground mb-3">
                        Hành động này sẽ xóa toàn bộ sản phẩm, lịch sử và danh sách yêu thích. Không thể hoàn tác.
                    </p>
                    <Button
                        variant={resetConfirm ? "destructive" : "outline"}
                        onClick={handleReset}
                        disabled={isResetting}
                        className={`w-full h-11 rounded-xl gap-2 font-semibold text-sm ${resetConfirm
                            ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            : "text-destructive border-destructive/20 hover:bg-destructive/10"
                            }`}
                    >
                        {isResetting ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Trash2 className="w-4 h-4" />
                        )}
                        {resetConfirm ? "Xác nhận xóa sạch dữ liệu?" : "Xóa toàn bộ dữ liệu"}
                    </Button>
                </CardContent>
            </Card>

            {/* Database info */}
            <Card>
                <CardContent className="p-4">
                    <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                        <Database className="w-4 h-4 text-primary" />
                        Dữ liệu hệ thống
                    </h3>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-muted/40 rounded-xl">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                                    <PieChart className="w-4 h-4 text-blue-500" />
                                </div>
                                <span className="text-sm font-medium">Tổng sản phẩm</span>
                            </div>
                            <span className="text-lg font-bold tabular-nums">
                                {productCount !== undefined ? productCount : "—"}
                            </span>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-muted/40 rounded-xl">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                                    <Zap className="w-4 h-4 text-green-500" />
                                </div>
                                <span className="text-sm font-medium">Trạng thái</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                </span>
                                <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                                    Online
                                </span>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* About */}
            <div className="px-4 py-6 text-center">
                <p className="text-xs font-medium text-foreground/80 mb-1">
                    Tạp Hóa Kênh 3 - Phan Văn Thành
                </p>
                <p className="text-[10px] text-muted-foreground">
                    Version 2.1.0 • Powered by MongoDB Atlas
                </p>
            </div>
        </div>
    );
}
