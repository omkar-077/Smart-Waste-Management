import { useEffect, useState } from "react";
import { subscribeToSettings, updateSettings } from "../../services/firebaseService";
import { useToast } from "../../context/ToastContext";
import { APP_CONFIG } from "../../config/appConfig";
import { Settings, Save, RefreshCw } from "lucide-react";

export default function SettingsPage() {
  const [settings, setSettings] = useState(null);
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    return subscribeToSettings((data) => {
      setSettings(data);
      if (!form) setForm(data);
    });
  }, []);

  const handleChange = (path, value) => {
    setForm((prev) => {
      const next = JSON.parse(JSON.stringify(prev));
      const keys = path.split(".");
      let obj = next;
      for (let i = 0; i < keys.length - 1; i++) obj = obj[keys[i]];
      obj[keys[keys.length - 1]] = value;
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateSettings(form);
      addToast("Settings saved successfully", "success");
    } catch (err) {
      addToast("Failed to save settings: " + err.message, "error");
    } finally {
      setSaving(false);
    }
  };

  if (!form) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-dark-500 text-sm">Loading settings from Firebase...</div>
    </div>
  );

  return (
    <div className="space-y-5 animate-fade-in max-w-3xl">
      <div className="page-header">
        <div>
          <h1 className="section-title">Settings</h1>
          <p className="text-dark-500 text-sm">Configurable system parameters — stored in Firebase</p>
        </div>
        <button onClick={handleSave} disabled={saving} className="btn-primary">
          <Save size={14} />
          {saving ? "Saving..." : "Save Settings"}
        </button>
      </div>

      {/* Municipality */}
      <div className="glass-card p-5">
        <h3 className="text-sm font-semibold text-dark-200 mb-4">Municipality</h3>
        <div className="grid grid-cols-2 gap-4">
          <SettingField label="Municipality Name" value={form?.municipality?.name} onChange={(v) => handleChange("municipality.name", v)} />
          <SettingField label="City" value={form?.municipality?.city} onChange={(v) => handleChange("municipality.city", v)} />
          <SettingField label="State" value={form?.municipality?.state} onChange={(v) => handleChange("municipality.state", v)} />
          <SettingField label="Country" value={form?.municipality?.country} onChange={(v) => handleChange("municipality.country", v)} />
        </div>
      </div>

      {/* Fill thresholds */}
      <div className="glass-card p-5">
        <h3 className="text-sm font-semibold text-dark-200 mb-4">Fill Level Thresholds (%)</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <SettingField label="Normal (%)" value={form?.thresholds?.normal} type="number" onChange={(v) => handleChange("thresholds.normal", +v)} />
          <SettingField label="Medium (%)" value={form?.thresholds?.medium} type="number" onChange={(v) => handleChange("thresholds.medium", +v)} />
          <SettingField label="High (%)" value={form?.thresholds?.high} type="number" onChange={(v) => handleChange("thresholds.high", +v)} />
          <SettingField label="Critical (%)" value={form?.thresholds?.critical} type="number" onChange={(v) => handleChange("thresholds.critical", +v)} />
        </div>
      </div>

      {/* Sensor */}
      <div className="glass-card p-5">
        <h3 className="text-sm font-semibold text-dark-200 mb-4">Sensor Parameters</h3>
        <div className="grid grid-cols-2 gap-4">
          <SettingField label="Empty Distance (cm)" value={form?.sensor?.emptyDistanceCm} type="number" onChange={(v) => handleChange("sensor.emptyDistanceCm", +v)} />
          <SettingField label="Full Distance (cm)" value={form?.sensor?.fullDistanceCm} type="number" onChange={(v) => handleChange("sensor.fullDistanceCm", +v)} />
        </div>
      </div>

      {/* Simulation */}
      <div className="glass-card p-5">
        <h3 className="text-sm font-semibold text-dark-200 mb-4">Simulation</h3>
        <div className="grid grid-cols-2 gap-4">
          <SettingField label="Alert Cooldown (minutes)" value={form?.alertCooldownMinutes} type="number" onChange={(v) => handleChange("alertCooldownMinutes", +v)} />
          <SettingField label="Simulated Bins" value={form?.numSimulatedBins} type="number" onChange={(v) => handleChange("numSimulatedBins", +v)} />
          <SettingField label="Update Interval (seconds)" value={form?.updateIntervalSeconds} type="number" onChange={(v) => handleChange("updateIntervalSeconds", +v)} />
        </div>
      </div>

      {/* Note about simulator */}
      <div className="glass-card p-4 bg-blue-500/5 border-blue-500/20">
        <p className="text-xs text-blue-300">
          <strong>Note:</strong> Simulator settings (numSimulatedBins, updateIntervalSeconds) require restarting the Python simulator to take effect.
          Threshold changes apply to the frontend immediately.
        </p>
      </div>
    </div>
  );
}

function SettingField({ label, value, type = "text", onChange }) {
  return (
    <div>
      <label className="block text-xs font-medium text-dark-400 mb-1">{label}</label>
      <input
        type={type}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className="input-field"
      />
    </div>
  );
}
