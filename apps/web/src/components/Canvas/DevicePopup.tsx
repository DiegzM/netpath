import React, { useState } from 'react';
import { useCanvasStore } from '../../store/useCanvasStore';
import type { Device } from '../../types/device';
import styles from './DevicePopup.module.css';

interface DevicePopupProps {
  device: Device;
  onClose: () => void;
}

export const DevicePopup: React.FC<DevicePopupProps> = ({ device, onClose }) => {
  const { devices, updateDevice } = useCanvasStore();
  const [label, setLabel] = useState(device.label);
  const [ip, setIp] = useState(device.config.ip || '');
  const [trafficRules, setTrafficRules] = useState(device.config.trafficRules ?? []);
  const canSendTraffic = device.kind === 'pc' || device.kind === 'server';
  const destinations = devices.filter(
    (candidate) =>
      candidate.id !== device.id &&
      (candidate.kind === 'pc' || candidate.kind === 'server'),
  );

  const handleSave = () => {
    updateDevice(device.id, {
      label,
      config: {
        ...device.config,
        ip: ip || undefined,
        trafficRules: canSendTraffic ? trafficRules : undefined,
      },
    });
    onClose();
  };

  const addTrafficRule = () => {
    const destination = destinations[0];
    if (!destination) return;

    setTrafficRules((current) => [
      ...current,
      {
        id: `tr-${Date.now()}`,
        destinationId: destination.id,
        packetsPerSecond: 10,
      },
    ]);
  };

  return (
    <div
      className={styles.overlay}
      onClick={onClose}
      onMouseDown={e => e.stopPropagation()}
      onContextMenu={e => e.preventDefault()}
    >
      <div
        className={styles.popup}
        onClick={e => e.stopPropagation()}
        onMouseDown={e => e.stopPropagation()}
      >
        <div className={styles.header}>
          <h2>{device.kind.toUpperCase()}</h2>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        <div className={styles.content}>
          {/* Label */}
          <div className={styles.field}>
            <label>Label</label>
            <input
              type="text"
              value={label}
              onChange={e => setLabel(e.target.value)}
              placeholder="Device name"
            />
          </div>

          {/* IP Address */}
          <div className={styles.field}>
            <label>IP Address (optional)</label>
            <input
              type="text"
              value={ip}
              onChange={e => setIp(e.target.value)}
              placeholder="e.g., 192.168.1.1"
            />
          </div>

          {canSendTraffic && (
            <div className={styles.trafficSection}>
              <div className={styles.trafficHeader}>
                <label>Traffic</label>
                <button
                  className={styles.addBtn}
                  onClick={addTrafficRule}
                  disabled={destinations.length === 0}
                >
                  Add
                </button>
              </div>

              {trafficRules.length === 0 && (
                <p className={styles.empty}>No packet traffic from this device.</p>
              )}

              {trafficRules.map((rule) => (
                <div className={styles.trafficRule} key={rule.id}>
                  <div className={styles.field}>
                    <label>Destination</label>
                    <select
                      value={rule.destinationId}
                      onChange={(event) => {
                        const destinationId = event.target.value;
                        setTrafficRules((current) =>
                          current.map((item) =>
                            item.id === rule.id ? { ...item, destinationId } : item,
                          ),
                        );
                      }}
                    >
                      {destinations.map((destination) => (
                        <option key={destination.id} value={destination.id}>
                          {destination.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className={styles.field}>
                    <label>{rule.packetsPerSecond} packets/sec</label>
                    <input
                      type="range"
                      min="1"
                      max="100"
                      step="1"
                      value={rule.packetsPerSecond}
                      onChange={(event) => {
                        const packetsPerSecond = Number(event.target.value);
                        setTrafficRules((current) =>
                          current.map((item) =>
                            item.id === rule.id ? { ...item, packetsPerSecond } : item,
                          ),
                        );
                      }}
                    />
                  </div>

                  <button
                    className={styles.deleteRuleBtn}
                    onClick={() => {
                      setTrafficRules((current) => current.filter((item) => item.id !== rule.id));
                    }}
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}

        </div>

        <div className={styles.footer}>
          <button className={styles.cancelBtn} onClick={onClose}>Cancel</button>
          <button className={styles.saveBtn} onClick={handleSave}>Save</button>
        </div>
      </div>
    </div>
  );
};
