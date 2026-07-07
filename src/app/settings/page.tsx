"use client";

import { useState, useRef, useEffect } from "react";
import { useAuthStore } from "@/store/use-auth-store";
import { Sidebar } from "@/components/layout/sidebar";
import { PageWrapper } from "@/components/layout/page-wrapper";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Camera, Lock, KeyRound, LogOut, Eye, EyeOff, User, Mail, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function SettingsPage() {
  const { user, changeAvatar, removeAvatar, changePassword, setPin, logout, isLoading } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Password change
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  // PIN change
  const [newPin, setNewPin] = useState("");
  const [pinLoading, setPinLoading] = useState(false);

  // Name change
  const [newName, setNewName] = useState(user?.name || "");
  const [nameLoading, setNameLoading] = useState(false);
  const { updateProfile } = useAuthStore();

  const handleNameChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || newName === user?.name) return;
    setNameLoading(true);
    try {
      await updateProfile(newName);
    } catch { /* handled by store */ }
    setNameLoading(false);
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await changeAvatar(file);
    } catch { /* handled by store */ }
  };

  useEffect(() => {
    if (user?.name) {
      setNewName(user.name);
    }
  }, [user?.name]);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) return;
    setPasswordLoading(true);
    try {
      await changePassword(currentPassword, newPassword);
      setCurrentPassword("");
      setNewPassword("");
    } catch { /* handled by store */ }
    setPasswordLoading(false);
  };

  const handlePinChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPin || newPin.length !== 4) return;
    setPinLoading(true);
    try {
      await setPin(newPin);
      setNewPin("");
    } catch { /* handled by store */ }
    setPinLoading(false);
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden animate-in fade-in duration-700">
      <Sidebar />
      <main className="flex-1 overflow-y-auto custom-scrollbar">
        <PageWrapper className="py-8 md:py-12">
          <div className="flex flex-col gap-8 max-w-3xl mx-auto">
            <header className="flex flex-col space-y-2">
              <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
              <p className="text-muted-foreground">Manage your account and preferences.</p>
            </header>

            {/* Profile Section */}
            <Card className="border-border/50 bg-card/30 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><User className="size-5" /> Profile</CardTitle>
                <CardDescription>Your account information.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Avatar */}
                <div className="flex items-center gap-6">
                  <div className="relative group">
                    {user?.avatar ? (
                      <img src={user.avatar} alt={user.name} className="size-20 rounded-2xl object-cover border-2 border-border/50" />
                    ) : (
                      <div className="size-20 rounded-2xl bg-primary/10 flex items-center justify-center text-primary text-2xl font-bold">
                        {user?.name?.charAt(0)?.toUpperCase() || "?"}
                      </div>
                    )}
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute inset-0 rounded-2xl bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    >
                      <Camera className="size-5 text-white" />
                    </button>
                    <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
                  </div>
                  
                  {/* Avatar Actions */}
                  <div className="flex flex-col gap-2">
                    <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={isLoading}>
                      Change Photo
                    </Button>
                    {user?.avatar && (
                      <Button variant="ghost" size="sm" onClick={() => removeAvatar()} disabled={isLoading} className="text-destructive hover:text-destructive hover:bg-destructive/10">
                        Remove
                      </Button>
                    )}
                  </div>

                  <div className="flex-1 space-y-3 ml-4">
                    <form onSubmit={handleNameChange} className="flex gap-2">
                      <div className="flex-1">
                        <Input 
                          value={newName}
                          onChange={(e) => setNewName(e.target.value)}
                          placeholder="Your Name"
                          className="h-9 bg-background/50 font-semibold text-lg"
                        />
                      </div>
                      <Button type="submit" size="sm" disabled={nameLoading || newName === user?.name} className="h-9">
                        {nameLoading ? <Loader2 className="size-4 animate-spin" /> : "Save"}
                      </Button>
                    </form>
                    <p className="text-sm text-muted-foreground flex items-center gap-1.5"><Mail className="size-3.5" />{user?.email}</p>
                    <div className="flex gap-2 mt-2">
                      <Badge variant="outline" className="text-[10px] uppercase">{user?.role}</Badge>
                      <Badge variant="outline" className="text-[10px] uppercase">{user?.authProvider}</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Change Password */}
            <Card className="border-border/50 bg-card/30 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Lock className="size-5" /> Change Password</CardTitle>
                <CardDescription>Update your account password.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePasswordChange} className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs uppercase tracking-wider text-muted-foreground">Current Password</Label>
                    <div className="relative">
                      <Input type={showPasswords ? "text" : "password"} value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="••••••••" className="pr-10 h-11 bg-background/50" />
                      <button type="button" onClick={() => setShowPasswords(!showPasswords)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                        {showPasswords ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs uppercase tracking-wider text-muted-foreground">New Password</Label>
                    <Input type={showPasswords ? "text" : "password"} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Min. 6 characters" className="h-11 bg-background/50" />
                  </div>
                  <Button type="submit" disabled={passwordLoading || !currentPassword || !newPassword} className="h-10">
                    {passwordLoading ? <Loader2 className="size-4 animate-spin" /> : "Update Password"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Change PIN */}
            <Card className="border-border/50 bg-card/30 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><KeyRound className="size-5" /> Security PIN</CardTitle>
                <CardDescription>Change your 4-digit unlock PIN. {user?.hasPin ? "You have a PIN set." : "No PIN set yet."}</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePinChange} className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs uppercase tracking-wider text-muted-foreground">New 4-Digit PIN</Label>
                    <Input type="password" maxLength={4} pattern="\d{4}" value={newPin} onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ""))} placeholder="••••" className="h-11 bg-background/50 w-40 text-center text-2xl tracking-[0.5em]" />
                  </div>
                  <Button type="submit" disabled={pinLoading || newPin.length !== 4} className="h-10 bg-emerald-600 hover:bg-emerald-700">
                    {pinLoading ? <Loader2 className="size-4 animate-spin" /> : (user?.hasPin ? "Update PIN" : "Set PIN")}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Danger Zone */}
            <Card className="border-destructive/30 bg-card/30 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-destructive"><Shield className="size-5" /> Session</CardTitle>
              </CardHeader>
              <CardContent>
                <Button variant="destructive" onClick={logout} className="h-10 gap-2">
                  <LogOut className="size-4" /> Sign Out
                </Button>
              </CardContent>
            </Card>
          </div>
        </PageWrapper>
      </main>
    </div>
  );
}
