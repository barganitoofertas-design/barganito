import React from "react";
import styles from "./PaymentMethodIcon.module.css";

interface PaymentMethodIconProps {
  paymentMethod: string | null | undefined;
  className?: string;
  style?: React.CSSProperties;
  showText?: boolean;
}

export default function PaymentMethodIcon({
  paymentMethod,
  className = "",
  style = {},
  showText = true,
}: PaymentMethodIconProps) {
  if (!paymentMethod) return null;

  const getIcon = (method: string) => {
    switch (method) {
      case "avista":
        return "💰";
      case "parcelado":
        return "💳";
      case "app_avista":
      case "app_prazo":
        return "📱";
      default:
        return null;
    }
  };

  const getTitle = (method: string) => {
    switch (method) {
      case "avista":
        return "À vista";
      case "parcelado":
        return "Parcelado";
      case "app_avista":
        return "App à vista";
      case "app_prazo":
        return "App a prazo";
      default:
        return method;
    }
  };

  const icon = getIcon(paymentMethod);
  if (!icon) return null;

  return (
    <div
      className={`${styles.icon} ${className}`}
      style={style}
      title={`Pagamento: ${getTitle(paymentMethod)}`}
    >
      <span className={styles.iconEmoji}>{icon}</span>
      {showText && (
        <span className={styles.iconText}>{getTitle(paymentMethod)}</span>
      )}
    </div>
  );
}
