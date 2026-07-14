export const formatCurrency = (amount: number | string) => {
  const numericAmount = Number(amount) || 0;
  const isNegative = numericAmount < 0;
  const absAmount = Math.abs(numericAmount);

  if (absAmount >= 100000) {
    return `${isNegative ? "-" : ""}₹${(absAmount / 100000).toFixed(2)} L`;
  }

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numericAmount);
};
