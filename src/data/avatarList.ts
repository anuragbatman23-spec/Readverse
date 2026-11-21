export interface AvatarItem {
  id: string;
  path: string;
  name: string;
}

export interface AvatarCategory {
  id: string;
  label: string;
  avatars: AvatarItem[];
}

export const AVATAR_CATEGORIES: AvatarCategory[] = [
  {
    "id": "anime",
    "label": "Anime",
    "avatars": [
      {
        "id": "anime/01_guts.png",
        "path": "/avatars/anime/01_guts.png",
        "name": "Guts"
      },
      {
        "id": "anime/02_lelouch.png",
        "path": "/avatars/anime/02_lelouch.png",
        "name": "Lelouch"
      },
      {
        "id": "anime/03_light_yagami.png",
        "path": "/avatars/anime/03_light_yagami.png",
        "name": "Light yagami"
      },
      {
        "id": "anime/04_l_lawliet.png",
        "path": "/avatars/anime/04_l_lawliet.png",
        "name": "L lawliet"
      },
      {
        "id": "anime/05_itachi_uchiha.png",
        "path": "/avatars/anime/05_itachi_uchiha.png",
        "name": "Itachi uchiha"
      },
      {
        "id": "anime/06_pain.png",
        "path": "/avatars/anime/06_pain.png",
        "name": "Pain"
      },
      {
        "id": "anime/07_kakashi_hatake.png",
        "path": "/avatars/anime/07_kakashi_hatake.png",
        "name": "Kakashi hatake"
      },
      {
        "id": "anime/08_eren_yeager.png",
        "path": "/avatars/anime/08_eren_yeager.png",
        "name": "Eren yeager"
      },
      {
        "id": "anime/09_levi_ackerman.png",
        "path": "/avatars/anime/09_levi_ackerman.png",
        "name": "Levi ackerman"
      },
      {
        "id": "anime/10_mikasa_ackerman.png",
        "path": "/avatars/anime/10_mikasa_ackerman.png",
        "name": "Mikasa ackerman"
      },
      {
        "id": "anime/11_satoru_gojo.png",
        "path": "/avatars/anime/11_satoru_gojo.png",
        "name": "Satoru gojo"
      },
      {
        "id": "anime/12_ryomen_sukuna.png",
        "path": "/avatars/anime/12_ryomen_sukuna.png",
        "name": "Ryomen sukuna"
      },
      {
        "id": "anime/13_shinji_ikari.png",
        "path": "/avatars/anime/13_shinji_ikari.png",
        "name": "Shinji ikari"
      },
      {
        "id": "anime/14_asuka_langley.png",
        "path": "/avatars/anime/14_asuka_langley.png",
        "name": "Asuka langley"
      },
      {
        "id": "anime/15_spike_spiegel.png",
        "path": "/avatars/anime/15_spike_spiegel.png",
        "name": "Spike spiegel"
      },
      {
        "id": "anime/16_edward_elric.png",
        "path": "/avatars/anime/16_edward_elric.png",
        "name": "Edward elric"
      },
      {
        "id": "anime/17_alphonse_elric.png",
        "path": "/avatars/anime/17_alphonse_elric.png",
        "name": "Alphonse elric"
      },
      {
        "id": "anime/18_thorfinn.png",
        "path": "/avatars/anime/18_thorfinn.png",
        "name": "Thorfinn"
      },
      {
        "id": "anime/19_kiyotaka_ayanokoji.png",
        "path": "/avatars/anime/19_kiyotaka_ayanokoji.png",
        "name": "Kiyotaka ayanokoji"
      },
      {
        "id": "anime/20_ken_kaneki.png",
        "path": "/avatars/anime/20_ken_kaneki.png",
        "name": "Ken kaneki"
      }
    ]
  },
  {
    "id": "gaming",
    "label": "Gaming",
    "avatars": [
      {
        "id": "gaming/01_kratos.png",
        "path": "/avatars/gaming/01_kratos.png",
        "name": "Kratos"
      },
      {
        "id": "gaming/02_geralt.png",
        "path": "/avatars/gaming/02_geralt.png",
        "name": "Geralt"
      },
      {
        "id": "gaming/03_arthur_morgan.png",
        "path": "/avatars/gaming/03_arthur_morgan.png",
        "name": "Arthur morgan"
      },
      {
        "id": "gaming/04_master_chief.png",
        "path": "/avatars/gaming/04_master_chief.png",
        "name": "Master chief"
      },
      {
        "id": "gaming/05_doom_slayer.png",
        "path": "/avatars/gaming/05_doom_slayer.png",
        "name": "Doom slayer"
      },
      {
        "id": "gaming/06_leon_kennedy.png",
        "path": "/avatars/gaming/06_leon_kennedy.png",
        "name": "Leon kennedy"
      },
      {
        "id": "gaming/07_ellie.png",
        "path": "/avatars/gaming/07_ellie.png",
        "name": "Ellie"
      },
      {
        "id": "gaming/08_joel_miller.png",
        "path": "/avatars/gaming/08_joel_miller.png",
        "name": "Joel miller"
      },
      {
        "id": "gaming/09_solid_snake.png",
        "path": "/avatars/gaming/09_solid_snake.png",
        "name": "Solid snake"
      },
      {
        "id": "gaming/10_cloud_strife.png",
        "path": "/avatars/gaming/10_cloud_strife.png",
        "name": "Cloud strife"
      },
      {
        "id": "gaming/11_ezio_auditore.png",
        "path": "/avatars/gaming/11_ezio_auditore.png",
        "name": "Ezio auditore"
      },
      {
        "id": "gaming/12_v_cyberpunk.png",
        "path": "/avatars/gaming/12_v_cyberpunk.png",
        "name": "V cyberpunk"
      },
      {
        "id": "gaming/13_2b_nier.png",
        "path": "/avatars/gaming/13_2b_nier.png",
        "name": "2b nier"
      },
      {
        "id": "gaming/14_aiden_pearce.png",
        "path": "/avatars/gaming/14_aiden_pearce.png",
        "name": "Aiden pearce"
      },
      {
        "id": "gaming/15_jin_sakai.png",
        "path": "/avatars/gaming/15_jin_sakai.png",
        "name": "Jin sakai"
      },
      {
        "id": "gaming/16_link.png",
        "path": "/avatars/gaming/16_link.png",
        "name": "Link"
      },
      {
        "id": "gaming/17_aloy.png",
        "path": "/avatars/gaming/17_aloy.png",
        "name": "Aloy"
      },
      {
        "id": "gaming/18_sun_wukong.png",
        "path": "/avatars/gaming/18_sun_wukong.png",
        "name": "Sun wukong"
      },
      {
        "id": "gaming/19_scorpion.png",
        "path": "/avatars/gaming/19_scorpion.png",
        "name": "Scorpion"
      },
      {
        "id": "gaming/20_dante.png",
        "path": "/avatars/gaming/20_dante.png",
        "name": "Dante"
      }
    ]
  },
  {
    "id": "aesthetic",
    "label": "Aesthetic",
    "avatars": [
      {
        "id": "aesthetic/01_aesthetic.png",
        "path": "/avatars/aesthetic/01_aesthetic.png",
        "name": "Aesthetic"
      },
      {
        "id": "aesthetic/02_aesthetic.png",
        "path": "/avatars/aesthetic/02_aesthetic.png",
        "name": "Aesthetic"
      },
      {
        "id": "aesthetic/03_aesthetic.png",
        "path": "/avatars/aesthetic/03_aesthetic.png",
        "name": "Aesthetic"
      },
      {
        "id": "aesthetic/04_aesthetic.png",
        "path": "/avatars/aesthetic/04_aesthetic.png",
        "name": "Aesthetic"
      },
      {
        "id": "aesthetic/05_aesthetic.png",
        "path": "/avatars/aesthetic/05_aesthetic.png",
        "name": "Aesthetic"
      },
      {
        "id": "aesthetic/06_aesthetic.png",
        "path": "/avatars/aesthetic/06_aesthetic.png",
        "name": "Aesthetic"
      },
      {
        "id": "aesthetic/07_aesthetic.png",
        "path": "/avatars/aesthetic/07_aesthetic.png",
        "name": "Aesthetic"
      },
      {
        "id": "aesthetic/08_aesthetic.png",
        "path": "/avatars/aesthetic/08_aesthetic.png",
        "name": "Aesthetic"
      },
      {
        "id": "aesthetic/09_aesthetic.png",
        "path": "/avatars/aesthetic/09_aesthetic.png",
        "name": "Aesthetic"
      },
      {
        "id": "aesthetic/10_aesthetic.png",
        "path": "/avatars/aesthetic/10_aesthetic.png",
        "name": "Aesthetic"
      },
      {
        "id": "aesthetic/11_aesthetic.png",
        "path": "/avatars/aesthetic/11_aesthetic.png",
        "name": "Aesthetic"
      },
      {
        "id": "aesthetic/12_aesthetic.png",
        "path": "/avatars/aesthetic/12_aesthetic.png",
        "name": "Aesthetic"
      },
      {
        "id": "aesthetic/13_aesthetic.png",
        "path": "/avatars/aesthetic/13_aesthetic.png",
        "name": "Aesthetic"
      },
      {
        "id": "aesthetic/14_aesthetic.png",
        "path": "/avatars/aesthetic/14_aesthetic.png",
        "name": "Aesthetic"
      },
      {
        "id": "aesthetic/15_aesthetic.png",
        "path": "/avatars/aesthetic/15_aesthetic.png",
        "name": "Aesthetic"
      },
      {
        "id": "aesthetic/16_aesthetic.png",
        "path": "/avatars/aesthetic/16_aesthetic.png",
        "name": "Aesthetic"
      },
      {
        "id": "aesthetic/17_aesthetic.png",
        "path": "/avatars/aesthetic/17_aesthetic.png",
        "name": "Aesthetic"
      },
      {
        "id": "aesthetic/18_aesthetic.png",
        "path": "/avatars/aesthetic/18_aesthetic.png",
        "name": "Aesthetic"
      },
      {
        "id": "aesthetic/19_aesthetic.png",
        "path": "/avatars/aesthetic/19_aesthetic.png",
        "name": "Aesthetic"
      },
      {
        "id": "aesthetic/20_aesthetic.png",
        "path": "/avatars/aesthetic/20_aesthetic.png",
        "name": "Aesthetic"
      }
    ]
  },
  {
    "id": "pokemon_1",
    "label": "Pokémon",
    "avatars": [
      {
        "id": "pokemon_1/01_gyarados.png",
        "path": "/avatars/pokemon_1/01_gyarados.png",
        "name": "Gyarados"
      },
      {
        "id": "pokemon_1/02_typhlosion.png",
        "path": "/avatars/pokemon_1/02_typhlosion.png",
        "name": "Typhlosion"
      },
      {
        "id": "pokemon_1/03_sceptile.png",
        "path": "/avatars/pokemon_1/03_sceptile.png",
        "name": "Sceptile"
      },
      {
        "id": "pokemon_1/04_swampert.png",
        "path": "/avatars/pokemon_1/04_swampert.png",
        "name": "Swampert"
      },
      {
        "id": "pokemon_1/05_bisharp.png",
        "path": "/avatars/pokemon_1/05_bisharp.png",
        "name": "Bisharp"
      },
      {
        "id": "pokemon_1/06_noivern.png",
        "path": "/avatars/pokemon_1/06_noivern.png",
        "name": "Noivern"
      },
      {
        "id": "pokemon_1/07_aggron.png",
        "path": "/avatars/pokemon_1/07_aggron.png",
        "name": "Aggron"
      },
      {
        "id": "pokemon_1/08_milotic.png",
        "path": "/avatars/pokemon_1/08_milotic.png",
        "name": "Milotic"
      },
      {
        "id": "pokemon_1/09_haxorus.png",
        "path": "/avatars/pokemon_1/09_haxorus.png",
        "name": "Haxorus"
      },
      {
        "id": "pokemon_1/10_volcarona.png",
        "path": "/avatars/pokemon_1/10_volcarona.png",
        "name": "Volcarona"
      },
      {
        "id": "pokemon_1/11_ferrothorn.png",
        "path": "/avatars/pokemon_1/11_ferrothorn.png",
        "name": "Ferrothorn"
      },
      {
        "id": "pokemon_1/12_mimikyu.png",
        "path": "/avatars/pokemon_1/12_mimikyu.png",
        "name": "Mimikyu"
      },
      {
        "id": "pokemon_1/13_chandelure.png",
        "path": "/avatars/pokemon_1/13_chandelure.png",
        "name": "Chandelure"
      },
      {
        "id": "pokemon_1/14_delphox.png",
        "path": "/avatars/pokemon_1/14_delphox.png",
        "name": "Delphox"
      },
      {
        "id": "pokemon_1/15_primarina.png",
        "path": "/avatars/pokemon_1/15_primarina.png",
        "name": "Primarina"
      },
      {
        "id": "pokemon_1/16_toxapex.png",
        "path": "/avatars/pokemon_1/16_toxapex.png",
        "name": "Toxapex"
      },
      {
        "id": "pokemon_1/17_dragapult.png",
        "path": "/avatars/pokemon_1/17_dragapult.png",
        "name": "Dragapult"
      },
      {
        "id": "pokemon_1/18_zygarde.png",
        "path": "/avatars/pokemon_1/18_zygarde.png",
        "name": "Zygarde"
      },
      {
        "id": "pokemon_1/19_alolan_ninetales.png",
        "path": "/avatars/pokemon_1/19_alolan_ninetales.png",
        "name": "Alolan ninetales"
      },
      {
        "id": "pokemon_1/20_kartana.png",
        "path": "/avatars/pokemon_1/20_kartana.png",
        "name": "Kartana"
      },
      {
        "id": "pokemon_1/21_nihilego.png",
        "path": "/avatars/pokemon_1/21_nihilego.png",
        "name": "Nihilego"
      },
      {
        "id": "pokemon_1/22_dhelmise.png",
        "path": "/avatars/pokemon_1/22_dhelmise.png",
        "name": "Dhelmise"
      },
      {
        "id": "pokemon_1/23_tapu_koko.png",
        "path": "/avatars/pokemon_1/23_tapu_koko.png",
        "name": "Tapu koko"
      },
      {
        "id": "pokemon_1/24_xerneas.png",
        "path": "/avatars/pokemon_1/24_xerneas.png",
        "name": "Xerneas"
      }
    ]
  },
  {
    "id": "pokemon_2",
    "label": "Pokémon II",
    "avatars": [
      {
        "id": "pokemon_2/01_pikachu.png",
        "path": "/avatars/pokemon_2/01_pikachu.png",
        "name": "Pikachu"
      },
      {
        "id": "pokemon_2/02_charizard.png",
        "path": "/avatars/pokemon_2/02_charizard.png",
        "name": "Charizard"
      },
      {
        "id": "pokemon_2/03_mewtwo.png",
        "path": "/avatars/pokemon_2/03_mewtwo.png",
        "name": "Mewtwo"
      },
      {
        "id": "pokemon_2/04_gengar.png",
        "path": "/avatars/pokemon_2/04_gengar.png",
        "name": "Gengar"
      },
      {
        "id": "pokemon_2/05_umbreon.png",
        "path": "/avatars/pokemon_2/05_umbreon.png",
        "name": "Umbreon"
      },
      {
        "id": "pokemon_2/06_lucario.png",
        "path": "/avatars/pokemon_2/06_lucario.png",
        "name": "Lucario"
      },
      {
        "id": "pokemon_2/07_greninja.png",
        "path": "/avatars/pokemon_2/07_greninja.png",
        "name": "Greninja"
      },
      {
        "id": "pokemon_2/08_rayquaza.png",
        "path": "/avatars/pokemon_2/08_rayquaza.png",
        "name": "Rayquaza"
      },
      {
        "id": "pokemon_2/09_eevee.png",
        "path": "/avatars/pokemon_2/09_eevee.png",
        "name": "Eevee"
      },
      {
        "id": "pokemon_2/10_espeon.png",
        "path": "/avatars/pokemon_2/10_espeon.png",
        "name": "Espeon"
      },
      {
        "id": "pokemon_2/11_vaporeon.png",
        "path": "/avatars/pokemon_2/11_vaporeon.png",
        "name": "Vaporeon"
      },
      {
        "id": "pokemon_2/12_jolteon.png",
        "path": "/avatars/pokemon_2/12_jolteon.png",
        "name": "Jolteon"
      },
      {
        "id": "pokemon_2/13_flareon.png",
        "path": "/avatars/pokemon_2/13_flareon.png",
        "name": "Flareon"
      },
      {
        "id": "pokemon_2/14_leafeon.png",
        "path": "/avatars/pokemon_2/14_leafeon.png",
        "name": "Leafeon"
      },
      {
        "id": "pokemon_2/15_glaceon.png",
        "path": "/avatars/pokemon_2/15_glaceon.png",
        "name": "Glaceon"
      },
      {
        "id": "pokemon_2/16_sylveon.png",
        "path": "/avatars/pokemon_2/16_sylveon.png",
        "name": "Sylveon"
      },
      {
        "id": "pokemon_2/17_dragonite.png",
        "path": "/avatars/pokemon_2/17_dragonite.png",
        "name": "Dragonite"
      },
      {
        "id": "pokemon_2/18_snorlax.png",
        "path": "/avatars/pokemon_2/18_snorlax.png",
        "name": "Snorlax"
      },
      {
        "id": "pokemon_2/19_blastoise.png",
        "path": "/avatars/pokemon_2/19_blastoise.png",
        "name": "Blastoise"
      },
      {
        "id": "pokemon_2/20_arceus.png",
        "path": "/avatars/pokemon_2/20_arceus.png",
        "name": "Arceus"
      }
    ]
  },
  {
    "id": "pokemon_legends",
    "label": "Pokémon Legends",
    "avatars": [
      {
        "id": "pokemon_legends/01_blastoise.png",
        "path": "/avatars/pokemon_legends/01_blastoise.png",
        "name": "Blastoise"
      },
      {
        "id": "pokemon_legends/02_venusaur.png",
        "path": "/avatars/pokemon_legends/02_venusaur.png",
        "name": "Venusaur"
      },
      {
        "id": "pokemon_legends/03_tyranitar.png",
        "path": "/avatars/pokemon_legends/03_tyranitar.png",
        "name": "Tyranitar"
      },
      {
        "id": "pokemon_legends/04_gallade.png",
        "path": "/avatars/pokemon_legends/04_gallade.png",
        "name": "Gallade"
      },
      {
        "id": "pokemon_legends/05_metagross.png",
        "path": "/avatars/pokemon_legends/05_metagross.png",
        "name": "Metagross"
      },
      {
        "id": "pokemon_legends/06_lugia.png",
        "path": "/avatars/pokemon_legends/06_lugia.png",
        "name": "Lugia"
      },
      {
        "id": "pokemon_legends/07_ho_oh.png",
        "path": "/avatars/pokemon_legends/07_ho_oh.png",
        "name": "Ho oh"
      },
      {
        "id": "pokemon_legends/08_articuno.png",
        "path": "/avatars/pokemon_legends/08_articuno.png",
        "name": "Articuno"
      },
      {
        "id": "pokemon_legends/09_zapdos.png",
        "path": "/avatars/pokemon_legends/09_zapdos.png",
        "name": "Zapdos"
      },
      {
        "id": "pokemon_legends/10_moltres.png",
        "path": "/avatars/pokemon_legends/10_moltres.png",
        "name": "Moltres"
      },
      {
        "id": "pokemon_legends/11_heatran.png",
        "path": "/avatars/pokemon_legends/11_heatran.png",
        "name": "Heatran"
      },
      {
        "id": "pokemon_legends/12_dialga.png",
        "path": "/avatars/pokemon_legends/12_dialga.png",
        "name": "Dialga"
      },
      {
        "id": "pokemon_legends/13_palkia.png",
        "path": "/avatars/pokemon_legends/13_palkia.png",
        "name": "Palkia"
      },
      {
        "id": "pokemon_legends/14_giratina.png",
        "path": "/avatars/pokemon_legends/14_giratina.png",
        "name": "Giratina"
      },
      {
        "id": "pokemon_legends/15_reshiram.png",
        "path": "/avatars/pokemon_legends/15_reshiram.png",
        "name": "Reshiram"
      },
      {
        "id": "pokemon_legends/16_zekrom.png",
        "path": "/avatars/pokemon_legends/16_zekrom.png",
        "name": "Zekrom"
      },
      {
        "id": "pokemon_legends/17_kyurem.png",
        "path": "/avatars/pokemon_legends/17_kyurem.png",
        "name": "Kyurem"
      },
      {
        "id": "pokemon_legends/18_solgaleo.png",
        "path": "/avatars/pokemon_legends/18_solgaleo.png",
        "name": "Solgaleo"
      },
      {
        "id": "pokemon_legends/19_lunala.png",
        "path": "/avatars/pokemon_legends/19_lunala.png",
        "name": "Lunala"
      },
      {
        "id": "pokemon_legends/20_aegislash.png",
        "path": "/avatars/pokemon_legends/20_aegislash.png",
        "name": "Aegislash"
      },
      {
        "id": "pokemon_legends/21_hydreigon.png",
        "path": "/avatars/pokemon_legends/21_hydreigon.png",
        "name": "Hydreigon"
      }
    ]
  }
];

export const DEFAULT_AVATAR = AVATAR_CATEGORIES[0]?.avatars[0]?.path || "/avatars/anime/01_guts.png";
