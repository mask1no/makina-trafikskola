const UNCONFIRMED_PREFIX = "TODO";

export function isAddressConfirmed(address: string) {
  return !address.trim().toUpperCase().startsWith(UNCONFIRMED_PREFIX);
}

/** Null when the address is still a placeholder and must stay off the public site. */
export function publicAddress(address: string) {
  return isAddressConfirmed(address) ? address : null;
}
