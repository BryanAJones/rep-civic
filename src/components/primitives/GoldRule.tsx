import './GoldRule.css';

interface GoldRuleProps {
  opacity?: number;
}

export function GoldRule({ opacity }: GoldRuleProps) {
  return (
    <div
      className="gold-rule"
      style={opacity !== undefined ? { opacity } : undefined}
    />
  );
}
