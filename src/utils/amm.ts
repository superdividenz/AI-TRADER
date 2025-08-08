export function getAmountOutConstantProduct(
  reserveIn: number,
  reserveOut: number,
  amountIn: number,
  feePercent = 0.003
): number {
  const amountInWithFee = amountIn * (1 - feePercent);
  const numerator = amountInWithFee * reserveOut;
  const denominator = reserveIn + amountInWithFee;
  const amountOut = numerator / denominator;
  return amountOut;
}
