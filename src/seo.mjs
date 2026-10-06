// Page-specific search snippets; product status stays in the existing visible content.
const metadata={
  cs:{
    models:{title:'Saunová kamna WATRA – porovnání IRIKON a IRIKON +e',description:'Porovnejte saunová kamna na dřevo IRIKON a hybridní saunová kamna na elektřinu a dřevo IRIKON +e: ceny, režimy vytápění a orientační nahřátí.'},
    hybrid:{title:'Hybridní saunová kamna na elektřinu a dřevo – WATRA',description:'Jak fungují saunová kamna na dřevo a elektřinu WATRA IRIKON +e? Nezávislé vytápění, rychlejší nahřátí a elektrický dotop při dohořívání dřeva.'},
    makers:{title:'Hybridní saunová kamna WATRA pro výrobce saun',description:'Česká saunová kamna na elektřinu a dřevo pro vaše saunové projekty. Seznamte se s IRIKON +e a možnostmi spolupráce s WATRA.'},
    project:{
      title:'Příběh WATRA – jak vznikla hybridní saunová kamna IRIKON',
      description:'Od stavby rodinné sauny k hybridním kamnům na dřevo a elektřinu. Richard Koubek vypráví, jak vznikla WATRA a proč její kamna nesou jméno IRIKON.'
    },
    home:{
      title:'WATRA – česká saunová kamna na elektřinu a dřevo',
      description:'Česká saunová kamna WATRA: IRIKON na dřevo s přípravou na rozšíření a hybridní IRIKON +e na elektřinu a dřevo. Porovnejte modely a režimy vytápění.'
    },
    irikon:{
      title:'WATRA IRIKON – saunová kamna na dřevo',
      description:'Saunová kamna WATRA IRIKON na dřevo s přípravou na elektrické rozšíření. Poznejte model, který můžete později rozšířit na hybridní IRIKON +e.'
    },
    electric:{
      title:'IRIKON +e – saunová kamna na elektřinu a dřevo | WATRA',
      description:'Hybridní saunová kamna WATRA IRIKON +e na elektřinu a dřevo. Nezávislé zdroje tepla, společné nahřívání a elektrický dotop podle teploty.'
    }
  },
  en:{
    project:{
      title:'The WATRA story – how the IRIKON hybrid sauna heater began',
      description:'From building a family sauna to a wood-fired and electric hybrid heater. Richard Koubek tells the WATRA story and explains the meaning behind the name IRIKON.'
    },
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
