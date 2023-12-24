import camelcaseKeys from "camelcase-keys";

export const knexCamelCaseResponse = (result) => {
  if (result) {
    if (result?.rows) return camelcaseKeys(result.rows, { deep: true });
  }
  return result;
};
