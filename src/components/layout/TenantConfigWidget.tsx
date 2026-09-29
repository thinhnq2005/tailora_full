"use client";

import React, { useState, useEffect } from "react";
import TenantConfigWidgetMain from "../layout/tenant/TenantConfigWidget";
import { useTenant } from "@/app/context/TenantContext";

export default function TenantConfigWidgetWrapper(): React.JSX.Element {
    const { tenant, updateLocalTheme } = useTenant();
    const [config, setConfig] = useState({
        name: "ĐẠI LÝ VLXD CẦN THƠ",
        primaryColor: "var(--theme-color)"
    });
    const [status, setStatus] = useState<string>("");

    // Đồng bộ dữ liệu từ Global Tenant Context vào Local State khi trang vừa tải xong
    useEffect(() => {
        if (tenant) {
            setConfig({
                name: tenant.brand_name,
                primaryColor: tenant.primary_color
            });
        }
    }, [tenant]);

    const handleUpdateTenantName = async (nextName: string) => {
        setConfig(prev => ({ ...prev, name: nextName }));
        // Cập nhật giao diện Client ngay lập tức để người dùng thấy đổi chữ trực quan
        updateLocalTheme(nextName, config.primaryColor);
        try {
            setStatus("Đang lưu tên thương hiệu đại lý lên hệ thống...");
            const res = await fetch("/api/tenant/config/update", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: nextName, primaryColor: config.primaryColor })
            });
            if (res.ok) setStatus("Đã cập nhật tên đại lý thành công!");
        } catch {
            setStatus("Hệ thống chưa thể lưu cấu hình, vui lòng thử lại.");
        }
    };

    const handleUpdatePrimaryColor = async (nextColor: string) => {
        setConfig(prev => ({ ...prev, primaryColor: nextColor }));
        // Cập nhật giao diện Client ngay lập tức để đổi màu nút bấm toàn trang theo thời gian thực
        updateLocalTheme(config.name, nextColor);
        try {
            setStatus("Đang lưu cấu hình màu nhận diện lên hệ thống...");
            const res = await fetch("/api/tenant/config/update", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: config.name, primaryColor: nextColor })
            });
            if (res.ok) setStatus("Đã cập nhật màu nhận diện thành công!");
        } catch {
            setStatus("Hệ thống chưa thể lưu cấu hình màu, vui lòng thử lại.");
        }
    };

    return (
        <div className="w-full space-y-2">
            {status && (
                <div className="text-[10px] font-mono text-[var(--theme-color)] bg-[#0f1026] px-3 py-1 rounded border border-[#2c2d59]/40">
                    {status}
                </div>
            )}
            <TenantConfigWidgetMain
                tenantName={config.name}
                primaryColor={config.primaryColor}
                onTenantNameChange={handleUpdateTenantName}
                onPrimaryColorChange={handleUpdatePrimaryColor}
            />
        </div>
    );
}