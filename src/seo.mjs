// Page-specific search snippets; product status stays in the existing visible content.
const metadata={
  cs:{
    home:{
      title:'WATRA – saunová kamna na dřevo i elektřinu',
      description:'Objevte česká saunová kamna WATRA: IRIKON na dřevo a hybridní IRIKON +e na dřevo i elektřinu. Poznejte oba modely a jejich výhody.'
    },
    irikon:{
      title:'WATRA IRIKON – saunová kamna na dřevo',
      description:'Saunová kamna WATRA IRIKON na dřevo s přípravou na elektrické rozšíření. Poznejte model, který můžete později rozšířit na hybridní IRIKON +e.'
    },
    electric:{
      title:'WATRA IRIKON +e – hybridní saunová kamna na dřevo i elektřinu',
      description:'Hybridní saunová kamna WATRA IRIKON +e spojují dřevo a elektřinu. Zvolte samostatný ohřev nebo oba zdroje pro rychlejší nahřátí sauny.'
    }
  },
  en:{
    home:{
      title:'WATRA – wood-fired and electric sauna heaters',
      description:'Discover Czech WATRA sauna heaters: the wood-fired IRIKON and the IRIKON +e hybrid for wood and electric heating. Explore both models and their benefits.'
    },
    irikon:{
      title:'WATRA IRIKON – wood-fired sauna heater',
      description:'The WATRA IRIKON wood-fired sauna heater is prepared for electric heating. Explore a model you can later upgrade to the IRIKON +e hybrid.'
    },
    electric:{
      title:'WATRA IRIKON +e – wood-fired and electric hybrid sauna heater',
      description:'The WATRA IRIKON +e hybrid sauna heater combines wood and electricity. Use either source independently or both together for a faster sauna warm-up.'
    }
  }
};

export function pageMetadata(lang,key,fallback){return metadata[lang]?.[key]||fallback;}
