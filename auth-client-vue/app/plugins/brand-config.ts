import { getBrandCssVars } from "../../config/brandConfig";

export default defineNuxtPlugin(() => {
    const vars = getBrandCssVars();
    const css = `:root { ${Object.entries(vars)
        .map(([k, v]) => `${k}: ${v};`)
        .join(" ")} }`;

    useHead({
        style: [{ innerHTML: css }],
    });
});
