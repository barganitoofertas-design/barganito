import styles from './Thermometer.module.css';

interface ThermometerProps {
  level: string;
  average?: number;
  showText?: boolean;
}

export default function Thermometer({ level, showText = true }: ThermometerProps) {
  const levelClass = level.replace(' ', '_');
  
  const getIcon = () => {
    switch (level) {
      case 'TOP': return '🔥';
      case 'Muito Bom': return '💎';
      case 'Bom': return '✅';
      case 'OK': return '👍';
      case 'Nheee': return '🤨';
      case 'Ruim': return '📉';
      default: return '🌡️';
    }
  };

  return (
    <div className={`${styles.container} ${styles[`level_${levelClass}`]}`}>
      <span className={styles.icon}>{getIcon()}</span>
      {showText && <span>{level}</span>}
    </div>
  );
}
