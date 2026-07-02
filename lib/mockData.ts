import type {
  Match,
  Team,
  Competition,
  Ball,
  Insight,
  Venue,
  Innings,
  BattingEntry,
  BowlingEntry,
  StandingsRow,
} from "./types";

// ============================================================================
// Teams
// ============================================================================

export const TEAMS: Record<string, Team> = {
  MI:   { code: "MI",   shortName: "MI",   fullName: "Mumbai Indians",            primaryColor: "#004BA0", secondaryColor: "#D1AB3E", currentRanking: 6 },
  CSK:  { code: "CSK",  shortName: "CSK",  fullName: "Chennai Super Kings",       primaryColor: "#FDB913", secondaryColor: "#005DB7", currentRanking: 3 },
  KKR:  { code: "KKR",  shortName: "KKR",  fullName: "Kolkata Knight Riders",     primaryColor: "#3A225D", secondaryColor: "#F2C72A", currentRanking: 4 },
  RCB:  { code: "RCB",  shortName: "RCB",  fullName: "Royal Challengers Bengaluru", primaryColor: "#DA1818", secondaryColor: "#000000", currentRanking: 5 },
  DC:   { code: "DC",   shortName: "DC",   fullName: "Delhi Capitals",            primaryColor: "#17449B", secondaryColor: "#EF1B23", currentRanking: 8 },
  SRH:  { code: "SRH",  shortName: "SRH",  fullName: "Sunrisers Hyderabad",       primaryColor: "#F7A721", secondaryColor: "#000000", currentRanking: 7 },
  PBKS: { code: "PBKS", shortName: "PBKS", fullName: "Punjab Kings",              primaryColor: "#DD1F2D", secondaryColor: "#A7A9AC", currentRanking: 9 },
  RR:   { code: "RR",   shortName: "RR",   fullName: "Rajasthan Royals",          primaryColor: "#EA1A85", secondaryColor: "#254AA5", currentRanking: 2 },
  LSG:  { code: "LSG",  shortName: "LSG",  fullName: "Lucknow Super Giants",      primaryColor: "#00A2D6", secondaryColor: "#FF7F00", currentRanking: 10 },
  GT:   { code: "GT",   shortName: "GT",   fullName: "Gujarat Titans",            primaryColor: "#4285F4", secondaryColor: "#1B2133", currentRanking: 1 },
};

// ── National teams (jersey / kit colors) ────────────────────────────────────
// ── National teams (jersey colors + real squads) ────────────────────────────
export const NATIONAL_TEAMS: Record<string, Team> = {
  // ICC Full Members — sorted by ranking
  IND: { code: "IND", shortName: "IND", fullName: "India",               primaryColor: "#005BAC", secondaryColor: "#F9A825", type: "national", flagEmoji: "🇮🇳", country: "IND", currentRanking: 1,
    squad: ["R Sharma","Y Jaiswal","V Kohli","SK Yadav","S Gill","KL Rahul","H Pandya","R Pant","A Patel","R Jadeja","J Bumrah","M Shami","K Yadav","A Singh","T Varma"] },
  AUS: { code: "AUS", shortName: "AUS", fullName: "Australia",            primaryColor: "#FFB81C", secondaryColor: "#006B54", type: "national", flagEmoji: "🇦🇺", country: "AUS", currentRanking: 2,
    squad: ["T Head","D Warner","S Smith","M Labuschagne","G Maxwell","M Marsh","J Inglis","M Wade","P Cummins","M Starc","J Hazlewood","A Zampa","C Green","N Ellis","S Abbott"] },
  SA:  { code: "SA",  shortName: "SA",  fullName: "South Africa",         primaryColor: "#007A4D", secondaryColor: "#FFB612", type: "national", flagEmoji: "🇿🇦", country: "RSA", currentRanking: 3,
    squad: ["T Bavuma","Q de Kock","R van der Dussen","D Miller","A Markram","H Klaasen","T Stubbs","M Jansen","K Rabada","A Nortje","K Maharaj","T Shamsi","W Parnell","R Hendricks","R Rickelton"] },
  ENG: { code: "ENG", shortName: "ENG", fullName: "England",              primaryColor: "#1D244E", secondaryColor: "#00A0C6", type: "national", flagEmoji: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", country: "ENG", currentRanking: 4,
    squad: ["J Buttler","P Salt","Z Crawley","J Root","H Brook","B Stokes","J Bairstow","L Livingstone","M Ali","S Curran","C Woakes","J Archer","M Wood","A Rashid","R Topley"] },
  NZ:  { code: "NZ",  shortName: "NZ",  fullName: "New Zealand",          primaryColor: "#000000", secondaryColor: "#A8A9AD", type: "national", flagEmoji: "🇳🇿", country: "NZL", currentRanking: 5,
    squad: ["K Williamson","D Conway","F Allen","T Latham","D Mitchell","G Phillips","M Bracewell","M Santner","T Southee","T Boult","L Ferguson","I Sodhi","A Milne","M Chapman","M Guptill"] },
  PAK: { code: "PAK", shortName: "PAK", fullName: "Pakistan",             primaryColor: "#005C3F", secondaryColor: "#FFFFFF", type: "national", flagEmoji: "🇵🇰", country: "PAK", currentRanking: 6,
    squad: ["B Azam","M Rizwan","F Zaman","S Ayub","A Shafique","I Ahmed","S Khan","I Wasim","Salman Agha","S Afridi","H Rauf","N Shah","M Nawaz","M Hasnain","A Ahmed"] },
  BAN: { code: "BAN", shortName: "BAN", fullName: "Bangladesh",           primaryColor: "#1A6B3A", secondaryColor: "#CE1126", type: "national", flagEmoji: "🇧🇩", country: "BAN", currentRanking: 7,
    squad: ["N Shanto","L Das","Shakib Al Hasan","Mushfiqur Rahim","Mahmudullah","T Hridoy","MH Miraz","R Hossain","T Ahmed","S Islam","M Rahman","Tanzid Hasan","Tanzim Hasan","H Mahmud","A Hossain"] },
  SL:  { code: "SL",  shortName: "SL",  fullName: "Sri Lanka",            primaryColor: "#003087", secondaryColor: "#C8A951", type: "national", flagEmoji: "🇱🇰", country: "SL",  currentRanking: 8,
    squad: ["P Nissanka","K Mendis","C Asalanka","D de Silva","A Mathews","D Shanaka","K Perera","W Hasaranga","D Wellalage","M Theekshana","M Pathirana","N Thushara","C Karunaratne","B Rajapaksa","D Chandimal"] },
  WI:  { code: "WI",  shortName: "WI",  fullName: "West Indies",          primaryColor: "#6E1436", secondaryColor: "#FFC726", type: "national", flagEmoji: "🌴", country: "WI",  currentRanking: 9,
    squad: ["R Powell","B King","S Hope","S Hetmyer","N Pooran","K Carty","K Mayers","A Russell","J Holder","R Shepherd","A Joseph","A Hosein","G Motie","O McCoy","F Allen"] },
  AFG: { code: "AFG", shortName: "AFG", fullName: "Afghanistan",          primaryColor: "#1D71B8", secondaryColor: "#CC0000", type: "national", flagEmoji: "🇦🇫", country: "AFG", currentRanking: 10,
    squad: ["R Gurbaz","I Zadran","R Khan","M Nabi","N Zadran","G Naib","A Omarzai","I Alikhil","K Janat","D Rasooli","Mujeeb Ur Rahman","F Farooqi","Naveen Ul Haq","N Ahmad","M Ishaq"] },
  // Associates & emerging nations
  IRE: { code: "IRE", shortName: "IRE", fullName: "Ireland",              primaryColor: "#169B62", secondaryColor: "#003A70", type: "national", flagEmoji: "🇮🇪", country: "IRE",
    squad: ["P Stirling","A Balbirnie","L Tucker","H Tector","C Campher","G Delany","G Dockrell","M Adair","J Little","B McCarthy","C Young","N Rock","F Hand","S Doherty","O Tector"] },
  ZIM: { code: "ZIM", shortName: "ZIM", fullName: "Zimbabwe",             primaryColor: "#D4212D", secondaryColor: "#009A44", type: "national", flagEmoji: "🇿🇼", country: "ZIM",
    squad: ["C Ervine","S Williams","S Raza","W Madhevere","T Marumani","I Kaia","R Chakabva","R Burl","B Bennett","L Jongwe","B Muzarabani","T Chatara","C Madande","D Myers","B Moor"] },
  SCO: { code: "SCO", shortName: "SCO", fullName: "Scotland",             primaryColor: "#003DA5", secondaryColor: "#FFFFFF", type: "national", flagEmoji: "🏴󠁧󠁢󠁳󠁣󠁴󠁿", country: "SCO",
    squad: ["K Coetzer","G Munsey","R Berrington","M Cross","M Leask","B McMullen","C Greaves","C MacLeod","S Sharif","B Wheal","M Watt","J Davey","H Tahir","M Jones","O Hairs"] },
  NED: { code: "NED", shortName: "NED", fullName: "Netherlands",          primaryColor: "#F77F00", secondaryColor: "#003DA5", type: "national", flagEmoji: "🇳🇱", country: "NED",
    squad: ["S Edwards","M O'Dowd","V Singh","T Nidamanuru","W Barresi","B de Leede","R van der Merwe","L van Beek","P van Meekeren","S Snater","F Klaassen","T Pringle","A Dutt","M Levitt","S Myburgh"] },
  USA: { code: "USA", shortName: "USA", fullName: "United States",        primaryColor: "#002868", secondaryColor: "#B22234", type: "national", flagEmoji: "🇺🇸", country: "USA",
    squad: ["M Patel","A Jones","A Gous","S Taylor","C Anderson","M Kumar","S Netravalkar","N Kenjige","A Khan","J Singh","H Singh","S van Schalkwyk","X Marshall","M Usman","J Drysdale"] },
  UAE: { code: "UAE", shortName: "UAE", fullName: "United Arab Emirates", primaryColor: "#CC0000", secondaryColor: "#FFFFFF", type: "national", flagEmoji: "🇦🇪", country: "UAE",
    squad: ["C Suri","V Aravind","CP Rizwan","M Usman","B Mazari","J Siddiqui","R Bhatia","K Meiyappan","W Ahmad","Z Khan","S Ahmed","S Dhingra","A Khan","Sultan Ahmed","Zahoor Khan"] },
  NAM: { code: "NAM", shortName: "NAM", fullName: "Namibia",              primaryColor: "#003087", secondaryColor: "#FFD700", type: "national", flagEmoji: "🇳🇦", country: "NAM",
    squad: ["G Erasmus","Z Green","N Loftie-Eaton","D Wiese","C Williams","J Frylinck","B Scholtz","JJ Smit","B Shikongo","T Lungameni","P Ya France","M van Lingen","R Baard","S Baard","R Nortje"] },
  PNG: { code: "PNG", shortName: "PNG", fullName: "Papua New Guinea",     primaryColor: "#000000", secondaryColor: "#CE1126", type: "national", flagEmoji: "🇵🇬", country: "PNG",
    squad: ["A Vala","T Ura","C Amini","L Siaka","N Vanua","J Reva","K Doriga","N Pokana","C Soper","G Toka","S Atai","J Bau","H Wagiman","G Poyas","N Reva"] },
  OMA: { code: "OMA", shortName: "OMA", fullName: "Oman",                 primaryColor: "#8B0000", secondaryColor: "#FFFFFF", type: "national", flagEmoji: "🇴🇲", country: "OMA",
    squad: ["A Ilyas","Z Maqsood","J Singh","K Prajapati","S Goud","Shoaib Khan","S Kumar","B Khan","Kaleemullah","M Nadeem","N Khushi","F Butt","Pratik Athavale","A Lalcheta","Suraj Kumar"] },
  CAN: { code: "CAN", shortName: "CAN", fullName: "Canada",               primaryColor: "#CC0000", secondaryColor: "#FFFFFF", type: "national", flagEmoji: "🇨🇦", country: "CAN",
    squad: ["N Dhaliwal","A Johnson","S Bin Zafar","D Heyliger","N Kumar","R Singh","J Gordon","H Thaker","P Singh","F Jamkhandi","J Siddiqui","R Bhatt","A Islam","K Seddon","P Amarnath"] },
  KEN: { code: "KEN", shortName: "KEN", fullName: "Kenya",                primaryColor: "#006600", secondaryColor: "#CC0000", type: "national", flagEmoji: "🇰🇪", country: "KEN",
    squad: ["A Obanda","I Karim","N Odhiambo","D Gondaria","C Obuya","S Ngoche","V Ouma","E Otieno","E Bundi","J Oluoch","L Oluoch","S Tikolo","D Obuobi","A Mwambi","R Patel"] },
  UGA: { code: "UGA", shortName: "UGA", fullName: "Uganda",               primaryColor: "#000000", secondaryColor: "#FCDC04", type: "national", flagEmoji: "🇺🇬", country: "UGA",
    squad: ["B Masaba","K Waiswa","R Mukasa","S Ssesazi","R Ali Shah","F Nsubuga","B Hassun","D Nakrani","C Waiswa","F Achelam","L Sematimba","H Senyondo","R Lutaya","P Murungi","D Kasozi"] },
};

// ── Franchise / league teams (with real squads) ─────────────────────────────
export const LEAGUE_TEAMS: Record<string, Team> = {
  // ── BBL — Big Bash League (Australia, 8 teams) ───────────────────────────
  SIXERS:    { code: "SIXERS",    shortName: "Sixers",    fullName: "Sydney Sixers",            primaryColor: "#FF1F8E", secondaryColor: "#1A1A1A", type: "franchise",
    squad: ["J Silk","J Philippe","D Hughes","M Henriques","T Curran","S Narine","J Cox","S Billings","S Abbott","B Dwarshuis","H Kerr","S O'Keefe","R van der Merwe","J Edwards","J Overton"] },
  STARS:     { code: "STARS",     shortName: "Stars",     fullName: "Melbourne Stars",           primaryColor: "#00A650", secondaryColor: "#FFFFFF", type: "franchise",
    squad: ["G Maxwell","J Clarke","T Rogers","M Stoinis","B Webster","H Cartwright","P Handscomb","A Zampa","N Coulter-Nile","L Morris","S Rainbird","A Russell","R Harding","B Couch","C Kellaway"] },
  HEAT:      { code: "HEAT",      shortName: "Heat",      fullName: "Brisbane Heat",             primaryColor: "#FF6600", secondaryColor: "#5B2D8E", type: "franchise",
    squad: ["X Bartlett","M Bryant","M Renshaw","J Brown","J Peirson","M Neser","T Cooper","P Walter","S Johnson","M Steketee","C Munro","B Laughlin","M Swepson","C Sully","J Wildermuth"] },
  SCORCHERS: { code: "SCORCHERS", shortName: "Scorchers", fullName: "Perth Scorchers",           primaryColor: "#F15A22", secondaryColor: "#003087", type: "franchise",
    squad: ["A Turner","C Bancroft","A Hardie","N Hobson","C Connolly","J Richardson","J Behrendorff","A Tye","A Agar","M Kelly","D Payne","K Hutchinson","S Whiteman","J Wells","N Hobson"] },
  HURRICANES:{ code: "HURRICANES",shortName: "Canes",     fullName: "Hobart Hurricanes",         primaryColor: "#5C1FAB", secondaryColor: "#00BFFF", type: "franchise",
    squad: ["B McDermott","M Wade","D Short","C Jewell","T David","N Ellis","R Meredith","J Paris","P Dooley","W Parker","D Malan","T Rogers","C Ingram","S Doherty","M Owen"] },
  THUNDER:   { code: "THUNDER",   shortName: "Thunder",   fullName: "Sydney Thunder",            primaryColor: "#16A829", secondaryColor: "#FFDD00", type: "franchise",
    squad: ["U Khawaja","J Sangha","O Davies","M Gilkes","A Ross","D Sams","N McAndrew","T Sangha","C Tremain","B Cutting","A Hales","S Hain","C Green","B Patterson","C Tremain"] },
  RENE:      { code: "RENE",      shortName: "Renegades", fullName: "Melbourne Renegades",       primaryColor: "#C8102E", secondaryColor: "#1A1A1A", type: "franchise",
    squad: ["J Fraser-McGurk","M Harvey","N Maddinson","P Handscomb","J Lehmann","R Rossouw","Noor Ahmad","J Lalor","C Boyce","K Richardson","J Pattinson","T O'Connell","S Harper","C Munro","A Zampа"] },
  STR:       { code: "STR",       shortName: "Strikers",  fullName: "Adelaide Strikers",         primaryColor: "#003087", secondaryColor: "#FFB81C", type: "franchise",
    squad: ["M Short","T Head","J Weatherald","H Hunt","A Carey","W Agar","H Conway","T Kelly","F du Plessis","I Cockbain","S Elliott","R Gibson","J Scrivens","D Worrall","N McAndrew"] },
  // ── PSL — Pakistan Super League (6 teams) ────────────────────────────────
  LAH:       { code: "LAH",       shortName: "Lahore",    fullName: "Lahore Qalandars",          primaryColor: "#00A651", secondaryColor: "#C8102E", type: "franchise",
    squad: ["S Afridi","F Zaman","A Shafique","H Brook","S Raza","D Wiese","L Livingstone","Sahibzada Farhan","Zaman Khan","H Rauf","N Shah","A Salman","Fakhar Zaman","M Haris","Abrar Ahmed"] },
  KAR:       { code: "KAR",       shortName: "Karachi",   fullName: "Karachi Kings",             primaryColor: "#00AEEF", secondaryColor: "#FFD700", type: "franchise",
    squad: ["I Wasim","B Azam","Sharjeel Khan","T Tahir","M Amir","N Ahmad","J Vince","J Cox","Mir Hamza","K Manzoor","A Jamal","Shoaib Bashir","Khurram Manzoor","M Hasan","Aamer Jamal"] },
  PES:       { code: "PES",       shortName: "Peshawar",  fullName: "Peshawar Zalmi",            primaryColor: "#F7A800", secondaryColor: "#C8102E", type: "franchise",
    squad: ["W Riaz","R Powell","T Kohler-Cadmore","M Haris","B Rajapaksa","Y Shah","Shoaib Malik","R Ahmed","S Irshad","Haseebullah","M Irfan","M Ali","S Masood","I Khan","S Saleem"] },
  QUE:       { code: "QUE",       shortName: "Quetta",    fullName: "Quetta Gladiators",         primaryColor: "#2D2D8F", secondaryColor: "#FFD700", type: "franchise",
    squad: ["Sarfaraz Ahmed","J Roy","R Rossouw","S Shakeel","U Khan","M Hasnain","A Ahmed","O Smith","T Seifert","K Manzoor","U Khawaja","A Nasir","M Asghar","B Shoaib","J Holder"] },
  MUL:       { code: "MUL",       shortName: "Multan",    fullName: "Multan Sultans",            primaryColor: "#8B0000", secondaryColor: "#FFD700", type: "franchise",
    squad: ["M Rizwan","S Masood","T David","R Rossouw","U Mir","A Afridi","Ihsanullah","M Ali","U Qadir","I Tahir","D Willey","K Pollard","R Meredith","M Renshaw","S Irshad"] },
  ISL:       { code: "ISL",       shortName: "Islamabad", fullName: "Islamabad United",          primaryColor: "#C8102E", secondaryColor: "#004B87", type: "franchise",
    squad: ["S Khan","A Hales","Azam Khan","P Stirling","A Ali","H Talat","F Ashraf","M Wasim Jr","Z Gohar","F Alam","R Raees","M Musa","G Dockrell","C Jordan","L Livingstone"] },
  // ── The Hundred (England, 8 teams) ───────────────────────────────────────
  OVI:       { code: "OVI",       shortName: "Oval",      fullName: "Oval Invincibles",          primaryColor: "#1A1A1A", secondaryColor: "#C9A84C", type: "franchise",
    squad: ["S Curran","J Roy","W Jacks","S Narine","J Cox","S Billings","S Mahmood","N Ellis","R Topley","L Evans","J Overton","D Paterson","T Helm","K Rabada","B Carse"] },
  LSP:       { code: "LSP",       shortName: "London",    fullName: "London Spirit",             primaryColor: "#000000", secondaryColor: "#00B5A4", type: "franchise",
    squad: ["M Ali","J Inglis","Z Crawley","B McDermott","A Rossington","W Madsen","J Little","C Wood","T Helm","P Brown","D Briggs","M Wood","G Dockrell","R Higgins","S Mahmood"] },
  MOR:       { code: "MOR",       shortName: "Originals", fullName: "Manchester Originals",      primaryColor: "#CC0000", secondaryColor: "#FF4500", type: "franchise",
    squad: ["J Buttler","P Salt","C Munro","L Livingstone","T Hartley","J Ball","M Parkinson","R Gleeson","C Brathwaite","D Lamb","S Finn","F Allen","J Overton","R Khan","I Wasim"] },
  SBR:       { code: "SBR",       shortName: "S Brave",   fullName: "Southern Brave",            primaryColor: "#2E1760", secondaryColor: "#00BFFF", type: "franchise",
    squad: ["J Vince","Q de Kock","D Conway","C Jordan","T Mills","G Garton","M Pepper","J Harrison","J Lintott","R Khan","J Turner","P Brown","D Payne","Liam Dawson","C Ingram"] },
  NSC:       { code: "NSC",       shortName: "N Super",   fullName: "Northern Superchargers",    primaryColor: "#FFD700", secondaryColor: "#1A1A1A", type: "franchise",
    squad: ["H Brook","A Lyth","B Duckett","F du Plessis","D Willey","A Rashid","B Carse","M Fisher","S Khan","B Gibson","F Allen","D Vilas","Finn Allen","B Raine","K Carver"] },
  TRR:       { code: "TRR",       shortName: "Rockets",   fullName: "Trent Rockets",             primaryColor: "#CC0033", secondaryColor: "#FFFFFF", type: "franchise",
    squad: ["J Root","A Hales","D Malan","S Patel","B Hutton","L Wood","D Wiese","I Wasim","T Shamsi","L Gregory","J Ball","H Brook","Liam Plunkett","T Curran","B Slater"] },
  WEF:       { code: "WEF",       shortName: "W Fire",    fullName: "Welsh Fire",                primaryColor: "#8B0000", secondaryColor: "#FFD700", type: "franchise",
    squad: ["J Bairstow","N Selman","J Clarke","Mujeeb Ur Rahman","L Ferguson","D Lloyd","D Douthwaite","R Higgins","D Budge","B Kellaway","M Ingram","J Fuller","C Cooke","D Payne","C Benjamin"] },
  BPH:       { code: "BPH",       shortName: "Phoenix",   fullName: "Birmingham Phoenix",        primaryColor: "#A0173A", secondaryColor: "#FFD700", type: "franchise",
    squad: ["M Ali","G Maxwell","D Short","I Tahir","A Milne","C Benjamin","B Howell","T Helm","L Norwell","M Lamb","A Thomson","K Carver","H Brooke","L Trevaskis","A Lyth"] },
  // ── SA20 (South Africa, 6 teams) ─────────────────────────────────────────
  SEC:       { code: "SEC",       shortName: "Sunrisers", fullName: "Sunrisers Eastern Cape",    primaryColor: "#F7A800", secondaryColor: "#000000", type: "franchise",
    squad: ["A Markram","T Stubbs","D Miller","M Jansen","G Coetzee","JJ Smit","O Baartman","W Lubbe","R van der Merwe","S Curran","R Rossouw","E Bosch","M Nortje","C Chetty","K Verreynne"] },
  MICT:      { code: "MICT",      shortName: "MI Cape",   fullName: "MI Cape Town",              primaryColor: "#004BA0", secondaryColor: "#D1AB3E", type: "franchise",
    squad: ["K Rabada","R Rickelton","R Khan","L Livingstone","R van der Dussen","D Brevis","T Boult","J Neesham","G Linde","E Jones","D Pothas","S Muthusamy","Akeal Hosein","M Pretorius","B Fortuin"] },
  JSK:       { code: "JSK",       shortName: "Jo'burg",   fullName: "Joburg Super Kings",        primaryColor: "#FDB913", secondaryColor: "#005DB7", type: "franchise",
    squad: ["F du Plessis","R Hendricks","K Zondo","N Burger","G Coetzee","I Tahir","M Theekshana","B Glover","J Holder","D Bravo","N Pooran","Imran Tahir","A Joseph","Leus du Plooy","C Saker"] },
  PREC:      { code: "PREC",      shortName: "Capitals",  fullName: "Pretoria Capitals",         primaryColor: "#002868", secondaryColor: "#00B5E2", type: "franchise",
    squad: ["H Klaasen","W Jacks","P Salt","A Nortje","W Parnell","T de Bruyn","E Bosch","D Dupavillon","T Abell","S Muthusamy","M Pretorius","R Baard","Leus du Plooy","C Dala","B Glover"] },
  PARR:      { code: "PARR",      shortName: "P Royals",  fullName: "Paarl Royals",              primaryColor: "#EA5B7C", secondaryColor: "#003087", type: "franchise",
    squad: ["D Miller","J Buttler","T Shamsi","K Maharaj","B Fortuin","L Williams","T Seifert","C Bosch","J Bird","M Pretorius","M Hasnain","A Phehlukwayo","D Pretorius","W Madsen","K Abbott"] },
  DURGD:     { code: "DURGD",     shortName: "Durban",    fullName: "Durban's Super Giants",     primaryColor: "#00A0C6", secondaryColor: "#FF6600", type: "franchise",
    squad: ["Q de Kock","T Bavuma","K Verreynne","M Stoinis","K Maharaj","P Subrayen","E Bosch","A Phehlukwayo","D Pretorius","K Abbott","Kyle Jamieson","Andile Phehlukwayo","Cody Chetty","R Frylinck","C Ingram"] },
  // ── CPL — Caribbean Premier League (6 teams) ─────────────────────────────
  TKR:       { code: "TKR",       shortName: "TKR",       fullName: "Trinbago Knight Riders",    primaryColor: "#3A225D", secondaryColor: "#F2C72A", type: "franchise",
    squad: ["A Russell","S Narine","S Hope","T Seifert","A Hosein","I Khan","K Williams","R Rampaul","D Ramdin","F Ahmed","R Reifer","K Paul","J Holder","Odean Smith","C Brathwaite"] },
  BARB:      { code: "BARB",      shortName: "Royals",    fullName: "Barbados Royals",            primaryColor: "#EA1A85", secondaryColor: "#254AA5", type: "franchise",
    squad: ["K Mayers","J Holder","G Phillips","Q de Kock","R Khan","O McCoy","A Joseph","D Drakes","Mujeeb Ur Rahman","D Bravo","Shai Hope","K Carty","D Chase","Hayley Matthews","J Blackwood"] },
  GAW:       { code: "GAW",       shortName: "Warriors",  fullName: "Guyana Amazon Warriors",    primaryColor: "#1A7A1A", secondaryColor: "#FFD700", type: "franchise",
    squad: ["S Hetmyer","B King","R Shepherd","G Motie","S Khan","I Tahir","O Smith","K Paul","V Permaul","Shoaib Malik","H Klaasen","N Bonner","K Sinclair","Keemo Paul","R Fudadin"] },
  JAT:       { code: "JAT",       shortName: "Tallawahs", fullName: "Jamaica Tallawahs",         primaryColor: "#FFD700", secondaryColor: "#1A1A1A", type: "franchise",
    squad: ["R Powell","A McCarthy","K Lewis","G Munsey","M Pretorius","M Amir","F Edwards","N Bonner","R Reifer","R Chase","S Cottrell","D Thomas","J Blackwood","A Nurse","C Hemraj"] },
  SKP:       { code: "SKP",       shortName: "Patriots",  fullName: "St Kitts & Nevis Patriots", primaryColor: "#006400", secondaryColor: "#FFD700", type: "franchise",
    squad: ["E Lewis","F Allen","D Thomas","R Emrit","S Cottrell","A Fletcher","D Drakes","A Joseph","S Tanvir","C Hemraj","A Nurse","Sheldon Cottrell","J Da Silva","P Narine","Odean Smith"] },
  SLK:       { code: "SLK",       shortName: "St Lucia",  fullName: "St Lucia Kings",            primaryColor: "#003DA5", secondaryColor: "#FFD700", type: "franchise",
    squad: ["N Pooran","F du Plessis","M Wood","W Riaz","R Chase","K Paul","K Williams","D Singh","O McCoy","K Pollard","S Kuggeleijn","D Bravo","T Narine","Alzarri Joseph","G Dockrell"] },
  // ── MLC — Major League Cricket (USA, 6 teams) ────────────────────────────
  LAKR:      { code: "LAKR",      shortName: "LA KR",     fullName: "LA Knight Riders",          primaryColor: "#3A225D", secondaryColor: "#F2C72A", type: "franchise",
    squad: ["S Narine","A Jones","S Netravalkar","N Kenjige","R Khan","J Holder","Q de Kock","M Starc","R Rossouw","W Salamkheil","H Singh","K Pollard","Odean Smith","D Bravo","M Patel"] },
  TSK:       { code: "TSK",       shortName: "Texas SK",  fullName: "Texas Super Kings",         primaryColor: "#FDB913", secondaryColor: "#005DB7", type: "franchise",
    squad: ["D Conway","F du Plessis","M Santner","I Tahir","D Bravo","W Agar","M Kumar","S van Schalkwyk","N Ahmad","M Wood","Noor Ahmad","Tim Southee","Dwayne Bravo","M Klinger","A Jones"] },
  MINE:      { code: "MINE",      shortName: "MI NY",     fullName: "MI New York",               primaryColor: "#004BA0", secondaryColor: "#D1AB3E", type: "franchise",
    squad: ["H Pandya","T Stubbs","T Boult","K Pollard","A Khan","A Gous","G Dockrell","Z Khan","A Hosein","J Singh","Jasdeep Singh","M Patel","R Shepherd","Trent Boult","X Marshall"] },
  SEAO:      { code: "SEAO",      shortName: "Orcas",     fullName: "Seattle Orcas",             primaryColor: "#008080", secondaryColor: "#002868", type: "franchise",
    squad: ["L Ferguson","K Mayers","A Nortje","C Anderson","J Cox","I Sodhi","M Patel","X Bartlett","K Paul","I Wasim","T Seifert","M Guptill","L van Beek","D Wiese","Hamish Rutherford"] },
  SFU:       { code: "SFU",       shortName: "Unicorns",  fullName: "San Francisco Unicorns",    primaryColor: "#FF6600", secondaryColor: "#6B2C91", type: "franchise",
    squad: ["G Maxwell","E Lewis","G Munsey","M Short","C Wood","T Nidamanuru","N Dhaliwal","Mujeeb Ur Rahman","A Markram","T Kohler-Cadmore","O Pienaar","S Snater","Logan van Beek","Stirling","Ryan ten Doeschate"] },
  WASF:      { code: "WASF",      shortName: "Freedom",   fullName: "Washington Freedom",        primaryColor: "#B22234", secondaryColor: "#002868", type: "franchise",
    squad: ["J Bairstow","P Salt","M Guptill","A Russell","Shakib Al Hasan","T Latham","D Bravo","T Shamsi","S Khan","S Bashir","D Drakes","M Usman","J Drysdale","C Anderson","H Singh"] },
};

export const ALL_TEAMS: Record<string, Team> = {
  ...TEAMS, ...NATIONAL_TEAMS, ...LEAGUE_TEAMS,
};

// ── Competitions registry ────────────────────────────────────────────────────
export const COMPETITIONS: Record<string, Competition> = {
  ipl2026:       { id: "ipl-2026",         name: "IPL 2026",                      shortName: "IPL",       type: "league",        format: "T20",  season: "2026",    logoColor: "#F7A800" },
  t20wc2026:     { id: "icc-t20wc-2026",   name: "ICC T20 World Cup 2026",        shortName: "T20 WC",    type: "international", format: "T20I", season: "2026",    logoColor: "#00A2D6" },
  ct2025:        { id: "icc-ct-2025",      name: "ICC Champions Trophy 2025",     shortName: "Champ. Tr.",type: "international", format: "ODI",  season: "2025",    logoColor: "#00A2D6" },
  ashes2526:     { id: "ashes-2025-26",    name: "The Ashes 2025-26",             shortName: "Ashes",     type: "bilateral",     format: "Test", season: "2025-26", logoColor: "#8B6914" },
  indEngTest2026:{ id: "ind-eng-test-2026",name: "India tour of England 2026",    shortName: "IND v ENG", type: "bilateral",     format: "Test", season: "2026",    logoColor: "#1565C0" },
  indAusT20i2026:{ id: "ind-aus-t20i-2026",name: "India tour of Australia 2026",  shortName: "IND v AUS", type: "bilateral",     format: "T20I", season: "2026",    logoColor: "#1565C0" },
  engSaOdi2026:  { id: "eng-sa-odi-2026",  name: "South Africa tour of England 2026", shortName: "ENG v SA", type: "bilateral", format: "ODI",  season: "2026",    logoColor: "#C8102E" },
  bbl2526:       { id: "bbl-2025-26",      name: "Big Bash League 2025-26",       shortName: "BBL",       type: "league",        format: "T20",  season: "2025-26", logoColor: "#00BFFF" },
  psl2026:       { id: "psl-2026",         name: "HBL PSL 2026",                  shortName: "PSL",       type: "league",        format: "T20",  season: "2026",    logoColor: "#00A651" },
  hundred2026:   { id: "hundred-2026",     name: "The Hundred 2026",              shortName: "Hundred",   type: "league",        format: "T20",  season: "2026",    logoColor: "#6B2C91" },
  sa202026:      { id: "sa20-2026",        name: "SA20 2026",                     shortName: "SA20",      type: "league",        format: "T20",  season: "2026",    logoColor: "#007A4D" },
  cpl2025:       { id: "cpl-2025",         name: "CPL 2025",                      shortName: "CPL",       type: "league",        format: "T20",  season: "2025",    logoColor: "#7B0041" },
  mlc2026:       { id: "mlc-2026",         name: "Major League Cricket 2026",     shortName: "MLC",       type: "league",        format: "T20",  season: "2026",    logoColor: "#B22234" },
};

// ============================================================================
// Venues
// ============================================================================

export const VENUES: Record<string, Venue> = {
  eden: {
    id: "eden",
    name: "Eden Gardens",
    city: "Kolkata",
    parScore: 171,
    battingFirstWinPct: 0.54,
  },
  wankhede: {
    id: "wankhede",
    name: "Wankhede Stadium",
    city: "Mumbai",
    parScore: 184,
    battingFirstWinPct: 0.49,
  },
  chinnaswamy: {
    id: "chinnaswamy",
    name: "M. Chinnaswamy Stadium",
    city: "Bengaluru",
    parScore: 192,
    battingFirstWinPct: 0.46,
  },
  chepauk: {
    id: "chepauk",
    name: "M. A. Chidambaram Stadium",
    city: "Chennai",
    parScore: 165,
    battingFirstWinPct: 0.58,
  },
  motera: {
    id: "motera",
    name: "Narendra Modi Stadium",
    city: "Ahmedabad",
    parScore: 178,
    battingFirstWinPct: 0.52,
  },
};

// ============================================================================
// The featured live match — KKR chasing 175 vs MI at Eden Gardens
// We pre-script a chase that's getting tense — mid-innings, 2nd innings ball 14.3
// ============================================================================

const PLAYERS_KKR = [
  "S Iyer", "V Iyer", "R Singh", "A Russell", "S Narine", "S Roy",
  "J Bairstow", "N Rana", "P Cummins", "U Yadav", "V Chakravarthy",
];

const PLAYERS_MI = [
  "R Sharma", "I Kishan", "S Yadav", "T David", "H Pandya", "T Stubbs",
  "P Krishna", "J Bumrah", "G Coetzee", "K Yadav", "P Mishra",
];

function mkBall(
  inningsNumber: 1 | 2,
  over: number,
  ballInOver: number,
  batterName: string,
  bowlerName: string,
  runs: number,
  options: Partial<Ball> = {}
): Ball {
  const id = `${inningsNumber}-${over}.${ballInOver}`;
  // Plausible coordinates per outcome
  const pitchX = (Math.random() - 0.5) * 1.6;
  const pitchY = 0.6 + Math.random() * 0.3;
  const heightAtBounce = 0.3 + Math.random() * 0.4;
  const lengthBuckets: NonNullable<Ball["bowlingLength"]>[] = ["yorker", "full", "good", "good", "short", "bouncer"];
  const bowlingLength = lengthBuckets[Math.floor(Math.abs(pitchY - 0.5) * 8) % lengthBuckets.length];
  const heightAtBatter =
    bowlingLength === "yorker" ? 0.05 + Math.random() * 0.05
    : bowlingLength === "full" ? 0.1 + Math.random() * 0.2
    : bowlingLength === "good" ? 0.35 + Math.random() * 0.2
    : bowlingLength === "short" ? 0.55 + Math.random() * 0.2
    : 0.75 + Math.random() * 0.2;
  const linesAll: NonNullable<Ball["bowlingLine"]>[] = ["wide-off", "outside-off", "off", "middle", "leg", "outside-leg", "wide-leg"];
  const bowlingLine = linesAll[Math.max(0, Math.min(linesAll.length - 1, Math.round(pitchX * 3 + 3)))];

  // Bowler-driven attributes (rough mock — Bumrah pace, Mishra spin, etc.)
  const isSpinner = /(narine|chakravarthy|mishra|k yadav|kuldeep|ashwin)/i.test(bowlerName);
  const isFast = /(bumrah|cummins|krishna|coetzee|u yadav)/i.test(bowlerName);
  const pace: Ball["pace"] = isFast ? "fast" : isSpinner ? "slow" : "medium-fast";
  const ballSpeedKmh =
    pace === "fast" ? 138 + Math.floor(Math.random() * 12)
    : pace === "slow" ? 82 + Math.floor(Math.random() * 16)
    : 125 + Math.floor(Math.random() * 12);

  return {
    id,
    inningsNumber,
    over,
    ballInOver,
    timestampIso: new Date().toISOString(),
    batterId: batterName,
    batterName,
    bowlerId: bowlerName,
    bowlerName,
    runs,
    extras: 0,
    isWicket: false,
    isBoundary4: runs === 4,
    isBoundary6: runs === 6,
    // Coordinates for the GIF (clip 1 — delivery)
    pitchX,
    pitchY,
    heightAtBounce,
    ballSpeedKmh,
    bowlingArm: "right",
    bowlingFrom: "over",
    bowlingLength,
    bowlingLine,
    heightAtBatter,
    pace,
    swingDirection: isFast ? (Math.random() > 0.5 ? "in" : "out") : "none",
    spinDirection: isSpinner ? (Math.random() > 0.5 ? "off" : "leg") : "none",
    ballVariation: isSpinner && Math.random() > 0.8 ? "googly" : isFast && bowlingLength === "yorker" ? "yorker" : isFast && bowlingLength === "bouncer" ? "bouncer" : "stock",
    // Coordinates for the GIF (clip 2 — field)
    shotAngle: Math.random() * 360,
    shotPower: Math.random(),
    shotLoft: runs === 6 ? 0.85 + Math.random() * 0.1 : runs === 4 ? 0.15 + Math.random() * 0.2 : Math.random() * 0.25,
    shotIsAerial: runs === 6 || (runs === 4 && Math.random() > 0.5),
    shotType: runs === 0 ? "defensive" : runs === 6 ? "drive" : "drive",
    oneLiner: oneLinerFor(batterName, bowlerName, runs, options.isWicket),
    ...options,
  };
}

function oneLinerFor(batter: string, bowler: string, runs: number, isWicket?: boolean): string {
  if (isWicket) return `${bowler} to ${batter}, OUT! Big breakthrough for the bowling side.`;
  if (runs === 6) return `${bowler} to ${batter}, SIX! Cleared the boundary with ease.`;
  if (runs === 4) return `${bowler} to ${batter}, FOUR! Crisply timed through the gap.`;
  if (runs === 0) return `${bowler} to ${batter}, no run. Dot.`;
  return `${bowler} to ${batter}, ${runs} run${runs > 1 ? "s" : ""}.`;
}

// ============================================================================
// Build the first innings (MI batted, made 174/6)
// ============================================================================

function buildInnings1(): Innings {
  const balls: Ball[] = [];
  const events: Array<[number, number, string, string, number, Partial<Ball>?]> = [
    // Over 1
    [1, 0, "R Sharma", "P Cummins", 1],
    [1, 1, "I Kishan", "P Cummins", 0],
    [1, 2, "I Kishan", "P Cummins", 4],
    [1, 3, "I Kishan", "P Cummins", 1],
    [1, 4, "R Sharma", "P Cummins", 0],
    [1, 5, "R Sharma", "P Cummins", 2],
    // Over 2
    [2, 0, "I Kishan", "V Chakravarthy", 6],
    [2, 1, "I Kishan", "V Chakravarthy", 0],
    [2, 2, "I Kishan", "V Chakravarthy", 1],
    [2, 3, "R Sharma", "V Chakravarthy", 4],
    [2, 4, "R Sharma", "V Chakravarthy", 0],
    [2, 5, "R Sharma", "V Chakravarthy", 1],
    // Over 6 — Rohit out
    [5, 4, "R Sharma", "S Narine", 0, { isWicket: true, dismissalType: "lbw", oneLiner: "S Narine to R Sharma, OUT! LBW — trapped in front. Huge breakthrough." }],
  ];
  for (const [o, b, batter, bowler, r, opt] of events) {
    balls.push(mkBall(1, o, b, batter, bowler, r, opt ?? {}));
  }

  // Skip ahead — pretend a full innings happened, summarize the card
  const battingCard: BattingEntry[] = [
    { playerId: "R Sharma", playerName: "Rohit Sharma", runs: 12, ballsFaced: 11, fours: 1, sixes: 0, strikeRate: 109.09, out: true, dismissal: "lbw b Narine" },
    { playerId: "I Kishan", playerName: "Ishan Kishan", runs: 41, ballsFaced: 28, fours: 5, sixes: 2, strikeRate: 146.43, out: true, dismissal: "c & b Chakravarthy" },
    { playerId: "S Yadav", playerName: "Suryakumar Yadav", runs: 56, ballsFaced: 32, fours: 6, sixes: 2, strikeRate: 175.00, out: true, dismissal: "c Iyer b Cummins" },
    { playerId: "T David", playerName: "Tim David", runs: 28, ballsFaced: 14, fours: 2, sixes: 2, strikeRate: 200.00, out: true, dismissal: "c Russell b Cummins" },
    { playerId: "H Pandya", playerName: "Hardik Pandya", runs: 22, ballsFaced: 16, fours: 1, sixes: 1, strikeRate: 137.50, out: false },
    { playerId: "T Stubbs", playerName: "Tristan Stubbs", runs: 9, ballsFaced: 7, fours: 1, sixes: 0, strikeRate: 128.57, out: false },
  ];

  const bowlingCard: BowlingEntry[] = [
    { playerId: "P Cummins", playerName: "Pat Cummins", oversBowled: 4, maidens: 0, runsConceded: 32, wickets: 2, economy: 8.00 },
    { playerId: "V Chakravarthy", playerName: "V. Chakravarthy", oversBowled: 4, maidens: 0, runsConceded: 28, wickets: 1, economy: 7.00 },
    { playerId: "S Narine", playerName: "S. Narine", oversBowled: 4, maidens: 0, runsConceded: 24, wickets: 1, economy: 6.00 },
    { playerId: "A Russell", playerName: "A. Russell", oversBowled: 3, maidens: 0, runsConceded: 38, wickets: 0, economy: 12.67 },
    { playerId: "U Yadav", playerName: "U. Yadav", oversBowled: 4, maidens: 0, runsConceded: 41, wickets: 1, economy: 10.25 },
    { playerId: "N Rana", playerName: "N. Rana", oversBowled: 1, maidens: 0, runsConceded: 11, wickets: 0, economy: 11.00 },
  ];

  return {
    number: 1,
    battingTeam: "MI",
    bowlingTeam: "KKR",
    runs: 174,
    wickets: 6,
    overs: 20,
    balls,
    battingCard,
    bowlingCard,
    fieldingPositions: KKR_FIELDERS,
  };
}

// Standard T20 spread for KKR fielding (each angle from batter, clockwise from straight)
// Bowler + WK not in this list (they're implied by the pitch geometry)
const KKR_FIELDERS: import("./types").FielderPosition[] = [
  { name: "S Iyer", positionName: "1st slip", angle: 340, distance: 0.18 },
  { name: "V Iyer", positionName: "cover", angle: 290, distance: 0.5 },
  { name: "N Rana", positionName: "mid-off", angle: 200, distance: 0.45 },
  { name: "P Cummins", positionName: "mid-on", angle: 165, distance: 0.45 },
  { name: "A Russell", positionName: "midwicket", angle: 125, distance: 0.55 },
  { name: "U Yadav", positionName: "deep square", angle: 90, distance: 0.92 },
  { name: "V Chakravarthy", positionName: "fine leg", angle: 35, distance: 0.92 },
  { name: "S Narine", positionName: "third man", angle: 320, distance: 0.92 },
  { name: "S Roy", positionName: "deep cover", angle: 260, distance: 0.92 },
];

const MI_FIELDERS: import("./types").FielderPosition[] = [
  { name: "I Kishan", positionName: "slip", angle: 340, distance: 0.2 },
  { name: "T David", positionName: "point", angle: 270, distance: 0.5 },
  { name: "S Yadav", positionName: "cover", angle: 250, distance: 0.55 },
  { name: "T Stubbs", positionName: "mid-off", angle: 200, distance: 0.45 },
  { name: "H Pandya", positionName: "mid-on", angle: 160, distance: 0.5 },
  { name: "R Sharma", positionName: "midwicket", angle: 125, distance: 0.55 },
  { name: "G Coetzee", positionName: "deep square leg", angle: 90, distance: 0.92 },
  { name: "P Mishra", positionName: "fine leg", angle: 30, distance: 0.92 },
  { name: "K Yadav", positionName: "third man", angle: 325, distance: 0.92 },
];

// ============================================================================
// Build the second innings — KKR chasing 175, mid-innings, tense
// We script a vivid sequence so the live experience is interesting
// ============================================================================

function buildInnings2(): Innings {
  const balls: Ball[] = [];

  // Over 1 — Iyer + V Iyer
  [
    ["S Iyer", "J Bumrah", 0],
    ["S Iyer", "J Bumrah", 1],
    ["V Iyer", "J Bumrah", 4, { isBoundary4: true }],
    ["V Iyer", "J Bumrah", 0],
    ["V Iyer", "J Bumrah", 2],
    ["V Iyer", "J Bumrah", 0],
  ].forEach((e, i) => balls.push(mkBall(2, 1, i, e[0] as string, e[1] as string, e[2] as number, (e[3] as Partial<Ball>) ?? {})));

  // Over 2 — Krishna
  [
    ["S Iyer", "P Krishna", 4, { isBoundary4: true }],
    ["S Iyer", "P Krishna", 1],
    ["V Iyer", "P Krishna", 6, { isBoundary6: true, oneLiner: "P Krishna to V Iyer, SIX! Pulled flat over deep midwicket." }],
    ["V Iyer", "P Krishna", 0],
    ["V Iyer", "P Krishna", 1],
    ["S Iyer", "P Krishna", 4, { isBoundary4: true }],
  ].forEach((e, i) => balls.push(mkBall(2, 2, i, e[0] as string, e[1] as string, e[2] as number, (e[3] as Partial<Ball>) ?? {})));

  // Over 3 — Coetzee
  [
    ["S Iyer", "G Coetzee", 1],
    ["V Iyer", "G Coetzee", 0],
    ["V Iyer", "G Coetzee", 2],
    ["V Iyer", "G Coetzee", 1],
    ["S Iyer", "G Coetzee", 0],
    ["S Iyer", "G Coetzee", 4, { isBoundary4: true }],
  ].forEach((e, i) => balls.push(mkBall(2, 3, i, e[0] as string, e[1] as string, e[2] as number, (e[3] as Partial<Ball>) ?? {})));

  // Over 4 — Bumrah, S Iyer out
  [
    ["S Iyer", "J Bumrah", 1],
    ["V Iyer", "J Bumrah", 0],
    ["V Iyer", "J Bumrah", 2],
    ["V Iyer", "J Bumrah", 1],
    ["S Iyer", "J Bumrah", 0, { isWicket: true, dismissalType: "bowled", oneLiner: "J Bumrah to S Iyer, OUT! Bowled through the gate, big wicket!" }],
    ["R Singh", "J Bumrah", 0],
  ].forEach((e, i) => balls.push(mkBall(2, 4, i, e[0] as string, e[1] as string, e[2] as number, (e[3] as Partial<Ball>) ?? {})));

  // Overs 5–13: simulated with a reasonable distribution
  const filler: Array<[number, number, string, string, number, Partial<Ball>?]> = [
    // Over 5
    [5, 0, "V Iyer", "P Mishra", 1], [5, 1, "R Singh", "P Mishra", 0], [5, 2, "R Singh", "P Mishra", 4, { isBoundary4: true }],
    [5, 3, "R Singh", "P Mishra", 1], [5, 4, "V Iyer", "P Mishra", 6, { isBoundary6: true, oneLiner: "P Mishra to V Iyer, SIX! Slog-swept high over square leg." }], [5, 5, "V Iyer", "P Mishra", 1],
    // Over 6
    [6, 0, "R Singh", "K Yadav", 1], [6, 1, "V Iyer", "K Yadav", 0], [6, 2, "V Iyer", "K Yadav", 2],
    [6, 3, "V Iyer", "K Yadav", 1], [6, 4, "R Singh", "K Yadav", 0], [6, 5, "R Singh", "K Yadav", 4, { isBoundary4: true }],
    // Over 7 — V Iyer out
    [7, 0, "V Iyer", "H Pandya", 1], [7, 1, "R Singh", "H Pandya", 2], [7, 2, "R Singh", "H Pandya", 0],
    [7, 3, "R Singh", "H Pandya", 1], [7, 4, "V Iyer", "H Pandya", 0, { isWicket: true, dismissalType: "caught", oneLiner: "H Pandya to V Iyer, OUT! Caught at long on, KKR in trouble." }], [7, 5, "A Russell", "H Pandya", 4, { isBoundary4: true }],
    // Over 8
    [8, 0, "R Singh", "P Krishna", 0], [8, 1, "R Singh", "P Krishna", 1], [8, 2, "A Russell", "P Krishna", 6, { isBoundary6: true, oneLiner: "P Krishna to A Russell, SIX! Massive, into the second tier." }],
    [8, 3, "A Russell", "P Krishna", 1], [8, 4, "R Singh", "P Krishna", 0], [8, 5, "R Singh", "P Krishna", 4, { isBoundary4: true }],
    // Over 9
    [9, 0, "A Russell", "P Mishra", 6, { isBoundary6: true, oneLiner: "P Mishra to A Russell, SIX! Down the ground." }], [9, 1, "A Russell", "P Mishra", 1], [9, 2, "R Singh", "P Mishra", 2],
    [9, 3, "R Singh", "P Mishra", 1], [9, 4, "A Russell", "P Mishra", 0], [9, 5, "A Russell", "P Mishra", 4, { isBoundary4: true }],
    // Over 10
    [10, 0, "R Singh", "K Yadav", 1], [10, 1, "A Russell", "K Yadav", 0], [10, 2, "A Russell", "K Yadav", 4, { isBoundary4: true }],
    [10, 3, "A Russell", "K Yadav", 1], [10, 4, "R Singh", "K Yadav", 2], [10, 5, "R Singh", "K Yadav", 1],
    // Over 11
    [11, 0, "A Russell", "J Bumrah", 1], [11, 1, "R Singh", "J Bumrah", 0], [11, 2, "R Singh", "J Bumrah", 1],
    [11, 3, "A Russell", "J Bumrah", 0], [11, 4, "A Russell", "J Bumrah", 4, { isBoundary4: true }], [11, 5, "A Russell", "J Bumrah", 1],
    // Over 12
    [12, 0, "R Singh", "G Coetzee", 6, { isBoundary6: true, oneLiner: "G Coetzee to R Singh, SIX! Pulled over fine leg." }], [12, 1, "R Singh", "G Coetzee", 1], [12, 2, "A Russell", "G Coetzee", 0],
    [12, 3, "A Russell", "G Coetzee", 1], [12, 4, "R Singh", "G Coetzee", 4, { isBoundary4: true }], [12, 5, "R Singh", "G Coetzee", 2],
    // Over 13
    [13, 0, "A Russell", "H Pandya", 1], [13, 1, "R Singh", "H Pandya", 0], [13, 2, "R Singh", "H Pandya", 2],
    [13, 3, "R Singh", "H Pandya", 1], [13, 4, "A Russell", "H Pandya", 1], [13, 5, "R Singh", "H Pandya", 0],
    // Over 14 — Russell c. Bumrah at over 14.3 (the famous moment we'll annotate)
    [14, 0, "A Russell", "J Bumrah", 1],
    [14, 1, "R Singh", "J Bumrah", 4, { isBoundary4: true }],
    [14, 2, "R Singh", "J Bumrah", 0],
    [14, 3, "A Russell", "J Bumrah", 0, { isWicket: true, dismissalType: "caught", oneLiner: "J Bumrah to A Russell, OUT! Caught at deep midwicket. Huge breakthrough for MI." }],
  ];
  filler.forEach(([o, b, batter, bowler, r, opt]) => balls.push(mkBall(2, o, b, batter as string, bowler as string, r, opt ?? {})));

  // Calculate current totals
  let runs = 0;
  let wickets = 0;
  balls.forEach(b => {
    runs += b.runs + b.extras;
    if (b.isWicket) wickets++;
  });
  const lastBall = balls[balls.length - 1];
  const overs = lastBall.over - 1 + (lastBall.ballInOver + 1) / 6;

  const battingCard: BattingEntry[] = [
    { playerId: "S Iyer", playerName: "Shreyas Iyer", runs: 14, ballsFaced: 13, fours: 2, sixes: 0, strikeRate: 107.69, out: true, dismissal: "b Bumrah" },
    { playerId: "V Iyer", playerName: "Venkatesh Iyer", runs: 26, ballsFaced: 18, fours: 1, sixes: 2, strikeRate: 144.44, out: true, dismissal: "c long-on b Pandya" },
    { playerId: "R Singh", playerName: "Rinku Singh", runs: 38, ballsFaced: 24, fours: 4, sixes: 1, strikeRate: 158.33, out: false, onStrike: true },
    { playerId: "A Russell", playerName: "Andre Russell", runs: 32, ballsFaced: 18, fours: 3, sixes: 2, strikeRate: 177.78, out: true, dismissal: "c Stubbs b Bumrah" },
    { playerId: "S Narine", playerName: "Sunil Narine", runs: 0, ballsFaced: 0, fours: 0, sixes: 0, strikeRate: 0, out: false, onStrike: true },
  ];

  const bowlingCard: BowlingEntry[] = [
    { playerId: "J Bumrah", playerName: "Jasprit Bumrah", oversBowled: 3, maidens: 0, runsConceded: 18, wickets: 2, economy: 6.00 },
    { playerId: "P Krishna", playerName: "P. Krishna", oversBowled: 2, maidens: 0, runsConceded: 28, wickets: 0, economy: 14.00 },
    { playerId: "G Coetzee", playerName: "G. Coetzee", oversBowled: 2, maidens: 0, runsConceded: 16, wickets: 0, economy: 8.00 },
    { playerId: "P Mishra", playerName: "P. Mishra", oversBowled: 2, maidens: 0, runsConceded: 19, wickets: 0, economy: 9.50 },
    { playerId: "K Yadav", playerName: "K. Yadav", oversBowled: 2, maidens: 0, runsConceded: 8, wickets: 0, economy: 4.00 },
    { playerId: "H Pandya", playerName: "Hardik Pandya", oversBowled: 2, maidens: 0, runsConceded: 9, wickets: 1, economy: 4.50 },
  ];

  return {
    number: 2,
    battingTeam: "KKR",
    bowlingTeam: "MI",
    runs,
    wickets,
    overs: Math.round(overs * 10) / 10,
    balls,
    battingCard,
    bowlingCard,
    fieldingPositions: MI_FIELDERS,
  };
}

// ============================================================================
// The featured live match
// ============================================================================

export const FEATURED_MATCH: Match = {
  id: "ipl2026-m37-kkrvmi",
  competition: COMPETITIONS.ipl2026,
  format: "T20",
  startTimeIso: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
  status: "live",
  venue: VENUES.eden,
  teamA: TEAMS.MI, // batting first
  teamB: TEAMS.KKR, // chasing
  toss: { winner: "MI", elected: "bat" },
  innings: [buildInnings1(), buildInnings2()],
  result: { winner: "KKR", margin: "by 4 wickets", teamARuns: 174, teamAWickets: 9, teamBRuns: 175, teamBWickets: 6, manOfMatch: "Andre Russell", manOfTournament: "Virat Kohli" },
};

// ============================================================================
// Other matches for the home page list (last 1 completed + next 5 upcoming)
// ============================================================================

function hourFromNow(h: number): string {
  return new Date(Date.now() + h * 60 * 60 * 1000).toISOString();
}

// ============================================================================
// Past matches — last ~7 days of results, with summaries + excitement scores
// ============================================================================

export const PAST_MATCHES: Match[] = [
  {
    id: "ipl2026-m36-cskvrcb",
    competition: COMPETITIONS.ipl2026,
    format: "T20",
    startTimeIso: hourFromNow(-22),
    status: "post-match",
    venue: VENUES.chinnaswamy,
    teamA: TEAMS.RCB,
    teamB: TEAMS.CSK,
    toss: { winner: "CSK", elected: "bowl" },
    innings: [],
    result: { winner: "CSK", margin: "by 4 wickets", teamARuns: 182, teamAWickets: 7, teamBRuns: 183, teamBWickets: 6 },
    summary: "Jadeja 47* off 24 — boundary count flipped in 19th over.",
    excitement: 9,
    highlightBadge: "Instant classic",
  },
  {
    id: "ipl2026-m35-givsmi",
    competition: COMPETITIONS.ipl2026,
    format: "T20",
    startTimeIso: hourFromNow(-46),
    status: "post-match",
    venue: VENUES.motera,
    teamA: TEAMS.GT,
    teamB: TEAMS.MI,
    toss: { winner: "MI", elected: "bowl" },
    innings: [],
    result: { winner: "GT", margin: "by 3 runs", teamARuns: 205, teamAWickets: 4, teamBRuns: 202, teamBWickets: 8 },
    summary: "Bumrah hat-trick over saved 206 vs Surya's 78.",
    excitement: 10,
    highlightBadge: "Last-over thriller",
  },
  {
    id: "ipl2026-m34-lsgvpbks",
    competition: COMPETITIONS.ipl2026,
    format: "T20",
    startTimeIso: hourFromNow(-70),
    status: "post-match",
    venue: VENUES.wankhede,
    teamA: TEAMS.LSG,
    teamB: TEAMS.PBKS,
    innings: [],
    result: { winner: "PBKS", margin: "by 38 runs", teamARuns: 167, teamAWickets: 10, teamBRuns: 205, teamBWickets: 6 },
    summary: "Iyer 75 + Arshdeep 4-fer overwhelmed LSG.",
    excitement: 5,
  },
  {
    id: "ipl2026-m33-kkrvrr",
    competition: COMPETITIONS.ipl2026,
    format: "T20",
    startTimeIso: hourFromNow(-94),
    status: "post-match",
    venue: VENUES.eden,
    teamA: TEAMS.KKR,
    teamB: TEAMS.RR,
    innings: [],
    result: { winner: "KKR", margin: "by 7 wickets", teamARuns: 154, teamAWickets: 8, teamBRuns: 155, teamBWickets: 3 },
    summary: "Narine 4/22 on a turning Eden — RR all out 154.",
    excitement: 6,
  },
  {
    id: "ipl2026-m32-dcvsrh",
    competition: COMPETITIONS.ipl2026,
    format: "T20",
    startTimeIso: hourFromNow(-118),
    status: "post-match",
    venue: VENUES.chepauk,
    teamA: TEAMS.DC,
    teamB: TEAMS.SRH,
    innings: [],
    result: { winner: "SRH", margin: "by 6 wickets", teamARuns: 134, teamAWickets: 9, teamBRuns: 135, teamBWickets: 4 },
    summary: "Bowlers' day at Chepauk — neither side topped 7 RPO.",
    excitement: 4,
  },
  {
    id: "ipl2026-m31-rrvkkr",
    competition: COMPETITIONS.ipl2026,
    format: "T20",
    startTimeIso: hourFromNow(-142),
    status: "post-match",
    venue: VENUES.eden,
    teamA: TEAMS.RR,
    teamB: TEAMS.KKR,
    innings: [],
    result: { winner: "RR", margin: "by 25 runs", teamARuns: 198, teamAWickets: 5, teamBRuns: 173, teamBWickets: 10 },
    summary: "Buttler 92(48) set a total KKR couldn't pace.",
    excitement: 7,
  },
  {
    id: "ipl2026-m30-mivcsk",
    competition: COMPETITIONS.ipl2026,
    format: "T20",
    startTimeIso: hourFromNow(-166),
    status: "post-match",
    venue: VENUES.wankhede,
    teamA: TEAMS.MI,
    teamB: TEAMS.CSK,
    innings: [],
    result: { winner: "MI", margin: "by 14 runs", teamARuns: 217, teamAWickets: 6, teamBRuns: 203, teamBWickets: 9 },
    summary: "Surya 102*, Hardik 4-fer — MI win the Clásico.",
    excitement: 9,
    highlightBadge: "Marquee win",
  },
];

// ============================================================================
// Upcoming matches — next ~7 days, with anticipation summaries
// ============================================================================

export const UPCOMING_MATCHES: Match[] = [
  {
    id: "ipl2026-m38-rrvgt",
    competition: COMPETITIONS.ipl2026,
    format: "T20",
    startTimeIso: hourFromNow(20),
    status: "upcoming",
    venue: VENUES.motera,
    teamA: TEAMS.RR,
    teamB: TEAMS.GT,
    innings: [],
    summary: "Top-two clash · playoff bye on the line. Buttler vs Bumrah is the duel of the season.",
    excitement: 10,
    highlightBadge: "Top of table",
  },
  {
    id: "ipl2026-m39-pbksvlsg",
    competition: COMPETITIONS.ipl2026,
    format: "T20",
    startTimeIso: hourFromNow(44),
    status: "upcoming",
    venue: VENUES.wankhede,
    teamA: TEAMS.PBKS,
    teamB: TEAMS.LSG,
    innings: [],
    summary: "Wooden-spoon scrap. Both sides need a miracle to make the playoffs.",
    excitement: 4,
  },
  {
    id: "ipl2026-m40-mivsrh",
    competition: COMPETITIONS.ipl2026,
    format: "T20",
    startTimeIso: hourFromNow(68),
    status: "upcoming",
    venue: VENUES.wankhede,
    teamA: TEAMS.MI,
    teamB: TEAMS.SRH,
    innings: [],
    summary: "Bumrah vs Cummins. 145+ kph express on a Wankhede pitch made for pace.",
    excitement: 8,
    highlightBadge: "Pace battle",
  },
  {
    id: "ipl2026-m41-cskvkkr",
    competition: COMPETITIONS.ipl2026,
    format: "T20",
    startTimeIso: hourFromNow(92),
    status: "upcoming",
    venue: VENUES.chepauk,
    teamA: TEAMS.CSK,
    teamB: TEAMS.KKR,
    innings: [],
    summary: "Two-time champs collide on a turning Chepauk. Spinners decide it.",
    excitement: 8,
    highlightBadge: "Rivalry",
  },
  {
    id: "ipl2026-m42-rcbvdc",
    competition: COMPETITIONS.ipl2026,
    format: "T20",
    startTimeIso: hourFromNow(116),
    status: "upcoming",
    venue: VENUES.chinnaswamy,
    teamA: TEAMS.RCB,
    teamB: TEAMS.DC,
    innings: [],
    summary: "Kohli needs 41 for IPL's first 9000-run milestone.",
    excitement: 9,
    highlightBadge: "Milestone watch",
  },
  {
    id: "ipl2026-m43-gtvsrh",
    competition: COMPETITIONS.ipl2026,
    format: "T20",
    startTimeIso: hourFromNow(140),
    status: "upcoming",
    venue: VENUES.motera,
    teamA: TEAMS.GT,
    teamB: TEAMS.SRH,
    innings: [],
    summary: "GT one win from No.1 finish. SRH still mathematically in.",
    excitement: 6,
  },
];

// Backward-compat alias
export const RECENT_MATCH = PAST_MATCHES[0];

// ============================================================================
// Live matches — Sarthak v0.7: home carousel needs MULTIPLE live matches.
// FEATURED_MATCH has full ball-by-ball; the others have minimal scoring data
// and override status + win-prob (they exist for the carousel visual).
// ============================================================================

// ============================================================================
// League standings — IPL 2026 mid-tournament
// ============================================================================

export const STANDINGS: StandingsRow[] = [
  { teamCode: "GT",   played: 12, won: 9, lost: 3, noResult: 0, netRunRate: +1.45, points: 18, qualified: "playoff" },
  { teamCode: "RR",   played: 12, won: 8, lost: 4, noResult: 0, netRunRate: +0.98, points: 16, qualified: "playoff" },
  { teamCode: "CSK",  played: 12, won: 7, lost: 5, noResult: 0, netRunRate: +0.32, points: 14 },
  { teamCode: "KKR",  played: 12, won: 7, lost: 5, noResult: 0, netRunRate: +0.18, points: 14 },
  { teamCode: "RCB",  played: 12, won: 6, lost: 6, noResult: 0, netRunRate: +0.05, points: 12 },
  { teamCode: "MI",   played: 12, won: 5, lost: 7, noResult: 0, netRunRate: -0.04, points: 10 },
  { teamCode: "SRH",  played: 12, won: 5, lost: 7, noResult: 0, netRunRate: -0.28, points: 10 },
  { teamCode: "DC",   played: 12, won: 4, lost: 8, noResult: 0, netRunRate: -0.45, points:  8, qualified: "eliminated" },
  { teamCode: "PBKS", played: 12, won: 3, lost: 9, noResult: 0, netRunRate: -0.91, points:  6, qualified: "eliminated" },
  { teamCode: "LSG",  played: 12, won: 2, lost:10, noResult: 0, netRunRate: -1.12, points:  4, qualified: "eliminated" },
];

export const LIVE_MATCHES: Match[] = [
  FEATURED_MATCH,
  {
    id: "ipl2026-l2-rcbvcsk",
    competition: COMPETITIONS.ipl2026,
    format: "T20",
    startTimeIso: new Date(Date.now() - 100 * 60 * 1000).toISOString(),
    status: "live",
    venue: VENUES.chinnaswamy,
    teamA: TEAMS.RCB,
    teamB: TEAMS.CSK,
    toss: { winner: "CSK", elected: "bowl" },
    innings: [
      {
        number: 1,
        battingTeam: "RCB",
        bowlingTeam: "CSK",
        runs: 148,
        wickets: 5,
        overs: 16.4,
        balls: [],
        battingCard: [],
        bowlingCard: [],
      },
    ],
    liveStatusOverride: "RCB 148/5 in 16.4 · on pace for 178",
    liveWinProbOverride: { teamCode: "CSK", pct: 0.56 },
  },
  {
    id: "ipl2026-l3-gtvrr",
    competition: COMPETITIONS.ipl2026,
    format: "T20",
    startTimeIso: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    status: "live",
    venue: VENUES.motera,
    teamA: TEAMS.GT,
    teamB: TEAMS.RR,
    toss: { winner: "GT", elected: "bat" },
    innings: [
      {
        number: 1,
        battingTeam: "GT",
        bowlingTeam: "RR",
        runs: 92,
        wickets: 2,
        overs: 8.2,
        balls: [],
        battingCard: [],
        bowlingCard: [],
      },
    ],
    liveStatusOverride: "GT cruising at 11.2 RPO in the powerplay",
    liveWinProbOverride: { teamCode: "GT", pct: 0.72 },
  },
];

// ============================================================================
// Mock insight feed — scraped-from-Twitter/Cricbuzz feel
// ============================================================================

// ============================================================================
// V2 insights — number-driven, stats vs opinions separated
// ============================================================================

import type { InsightV2, PitchReport } from "./types";

export const MOCK_INSIGHTS_V2: InsightV2[] = [
  {
    id: "v2-1",
    category: "stat",
    text: "Russell's strike rate of 177.8 is the highest by any KKR finisher this season; he fell after facing 18 balls.",
    numericHighlights: ["177.8", "18 balls"],
    relatedBallId: "2-14.3",
    timestampIso: new Date(Date.now() - 30 * 1000).toISOString(),
    tags: ["death-overs", "fallen"],
  },
  {
    id: "v2-2",
    category: "stat",
    text: "Bumrah figures: 2/18 in 3 overs · economy 6.0 · 0 boundaries in his last 12 balls.",
    numericHighlights: ["2/18", "3", "6.0", "0", "12 balls"],
    relatedBallId: "2-14.3",
    timestampIso: new Date(Date.now() - 45 * 1000).toISOString(),
    tags: ["bowling-spell"],
  },
  {
    id: "v2-3",
    category: "stat",
    text: "KKR have lost 4 of last 5 fixtures at Eden Gardens when chasing 170+.",
    numericHighlights: ["4 of last 5", "170+"],
    timestampIso: new Date(Date.now() - 90 * 1000).toISOString(),
    tags: ["venue-stat"],
  },
  {
    id: "v2-4",
    category: "stat",
    text: "Rinku Singh vs pace in death overs this IPL: SR 138 · vs spin: 192. MI bowling 5 of next 6 pace.",
    numericHighlights: ["138", "192", "5 of next 6"],
    timestampIso: new Date(Date.now() - 120 * 1000).toISOString(),
    tags: ["matchup"],
  },
  {
    id: "v2-5",
    category: "stat",
    text: "Suryakumar 56(32) — his 12th 50+ score at Eden Gardens, most by any visiting batter.",
    numericHighlights: ["56(32)", "12th"],
    timestampIso: new Date(Date.now() - 180 * 1000).toISOString(),
    tags: ["milestone"],
  },
  {
    id: "v2-6",
    category: "stat",
    text: "Required RPO: 12.55. KKR have chased 12+ RPO in death only 1 of 9 attempts this season.",
    numericHighlights: ["12.55", "1 of 9"],
    timestampIso: new Date(Date.now() - 15 * 1000).toISOString(),
    tags: ["required-rate"],
  },
  {
    id: "v2-7",
    category: "opinion",
    text: "Bumrah's pattern of returning to remove the set finisher is paying off — third such dismissal in 5 matches.",
    attribution: { handle: "@hypocaust", sourceTier: "analyst" },
    timestampIso: new Date(Date.now() - 60 * 1000).toISOString(),
    tags: ["analysis"],
  },
  {
    id: "v2-8",
    category: "opinion",
    text: "Eden Gardens dew should start kicking in around over 16 — KKR's lower order needs to survive till then.",
    attribution: { handle: "@JatinSapru", sourceTier: "analyst" },
    timestampIso: new Date(Date.now() - 200 * 1000).toISOString(),
    tags: ["conditions"],
  },
];

// ============================================================================
// Pitch reports per venue — for the Info tab
// ============================================================================

export const PITCH_REPORTS: Record<string, PitchReport> = {
  eden: {
    venueId: "eden",
    surfaceType: "balanced",
    paceFriendly: 6,
    spinFriendly: 6,
    bounceConsistency: 7,
    expectedFirstInningsScore: { low: 155, mid: 171, high: 188 },
    dewFactor: "high",
    bullets: [
      "True bounce in the first 8 overs — pace bowlers find swing under the lights early on.",
      "Square turn emerges around overs 10–14 if the pitch hasn't been rolled; spinners can grip.",
      "Dew arrives from over 14 onward in night matches, making the ball skid on. Chasing gets easier.",
      "Boundaries on the leg side are slightly shorter than the off — favours the pull shot.",
      "Bat-first wins ~54% historically; the dew penalty for batting second is real but not decisive.",
    ],
  },
  wankhede: {
    venueId: "wankhede",
    surfaceType: "red-soil",
    paceFriendly: 7,
    spinFriendly: 4,
    bounceConsistency: 8,
    expectedFirstInningsScore: { low: 170, mid: 184, high: 205 },
    dewFactor: "moderate",
    bullets: [
      "Red-soil surface offers consistent bounce — front-foot drives flow.",
      "Sea-breeze swing early; bowlers who can hit the seam at 140+ km/h get rewards.",
      "Short straight boundaries (~62m) make miss-hit sixes possible.",
      "Spinners struggle unless they can land the cross-seam; expect ~7+ RPO against spin.",
      "Highest IPL score (~235) was made here — par moves with the wind direction.",
    ],
  },
  chinnaswamy: {
    venueId: "chinnaswamy",
    surfaceType: "balanced",
    paceFriendly: 5,
    spinFriendly: 5,
    bounceConsistency: 6,
    expectedFirstInningsScore: { low: 180, mid: 192, high: 215 },
    bullets: [
      "Shortest boundaries on the IPL circuit — straight is just ~60m.",
      "Altitude (920m) means the ball carries further; sixes are 8-10% longer than at sea level.",
      "Dew effect is moderate; toss winners often choose to chase.",
      "Wrist-spinners enjoy slightly more turn here than seamers do swing.",
    ],
  },
  chepauk: {
    venueId: "chepauk",
    surfaceType: "dry",
    paceFriendly: 4,
    spinFriendly: 8,
    bounceConsistency: 5,
    expectedFirstInningsScore: { low: 145, mid: 165, high: 180 },
    bullets: [
      "Black-soil surface that holds together but grips for spin from over 1.",
      "Two-paced bounce in the second innings — sweeps risky after over 12.",
      "Pace off the ball is the bowling equalizer — cutters and slower bouncers thrive.",
      "Bat-first heavily favoured (58%); chasing here demands a fast start.",
    ],
  },
  motera: {
    venueId: "motera",
    surfaceType: "balanced",
    paceFriendly: 6,
    spinFriendly: 6,
    bounceConsistency: 7,
    expectedFirstInningsScore: { low: 165, mid: 178, high: 195 },
    bullets: [
      "Largest stadium in the world by capacity; straight boundaries are 80m+.",
      "Even bounce, slight movement under lights for the first 6 overs.",
      "Spinners get drift more than turn; settled batters can dominate over 8-15.",
      "Dew is rare here — toss decisions are usually condition-driven, not dew-driven.",
    ],
  },
};

export const MOCK_INSIGHTS: Insight[] = [
  {
    id: "ins-1",
    sourceTier: "analyst",
    sourceHandle: "@mufaddal_vohra",
    text: "Andre Russell's dismissal — only the 3rd time this season a KKR finisher has fallen with 30+ runs needed off final 6 overs.",
    timestampIso: new Date(Date.now() - 30 * 1000).toISOString(),
    relatedBallId: "2-14.3",
    tags: ["wicket", "milestone"],
  },
  {
    id: "ins-2",
    sourceTier: "cricbuzz",
    sourceHandle: "Cricbuzz",
    text: "Bumrah now has 2/18 in 3 overs. He's been brought back specifically for the Russell over.",
    timestampIso: new Date(Date.now() - 45 * 1000).toISOString(),
    relatedBallId: "2-14.3",
    tags: ["bowling-spell"],
  },
  {
    id: "ins-3",
    sourceTier: "analyst",
    sourceHandle: "@CricCrazyJohns",
    text: "KKR have now lost the equivalent fixture at Eden Gardens in 4 of last 5 seasons when chasing 170+.",
    timestampIso: new Date(Date.now() - 90 * 1000).toISOString(),
    tags: ["venue-stat"],
  },
  {
    id: "ins-4",
    sourceTier: "analyst",
    sourceHandle: "@IPLT20stats",
    text: "Rinku Singh strike rate vs spin in death overs this IPL: 192. Vs pace: 138. MI need to keep him on pace.",
    timestampIso: new Date(Date.now() - 120 * 1000).toISOString(),
    tags: ["matchup", "death-overs"],
  },
  {
    id: "ins-5",
    sourceTier: "espn",
    sourceHandle: "ESPNcricinfo",
    text: "Suryakumar Yadav top-scored with 56(32). His 12th 50+ score at Eden Gardens — most by any visiting batter.",
    timestampIso: new Date(Date.now() - 180 * 1000).toISOString(),
    tags: ["milestone", "venue-record"],
  },
  {
    id: "ins-6",
    sourceTier: "analyst",
    sourceHandle: "@StatNoise",
    text: "Required run rate now 12.55. KKR have chased 12+ RPO in death only once this season.",
    timestampIso: new Date(Date.now() - 15 * 1000).toISOString(),
    tags: ["required-rate", "death-overs"],
  },
  {
    id: "ins-7",
    sourceTier: "analyst",
    sourceHandle: "@hypocaust",
    text: "Bumrah's last 2 wickets in death overs at Eden Gardens have both been off-stump deliveries to right-handers. Pattern setup.",
    timestampIso: new Date(Date.now() - 60 * 1000).toISOString(),
    tags: ["bowling-analysis"],
  },
];


// ============================================================================
// Global matches — international, bilateral, and league fixtures
// Non-IPL matches for home page diversity
// ============================================================================

export const LIVE_INTERNATIONAL: Match[] = [
  {
    id: "ind-aus-t20i-2026-m2-live",
    format: "T20I",
    competition: COMPETITIONS.indAusT20i2026,
    matchNumber: "2nd T20I",
    startTimeIso: new Date(Date.now() - 2.5 * 3600000).toISOString(),
    status: "live",
    venue: { id: "scg", name: "Sydney Cricket Ground", city: "Sydney", country: "AUS", parScore: 168, battingFirstWinPct: 0.51 },
    teamA: NATIONAL_TEAMS.AUS,
    teamB: NATIONAL_TEAMS.IND,
    toss: { winner: "AUS", elected: "bat" },
    innings: [
      {
        number: 1,
        battingTeam: "AUS",
        bowlingTeam: "IND",
        runs: 175,
        wickets: 8,
        overs: 20,
        balls: [],
        battingCard: [
          { playerId: "dwarner", playerName: "D Warner",       runs: 14, ballsFaced: 12, fours: 2, sixes: 0, strikeRate: 116.7, out: true,  dismissal: "c Rahul b Bumrah" },
          { playerId: "thead",   playerName: "T Head",         runs: 52, ballsFaced: 34, fours: 6, sixes: 2, strikeRate: 152.9, out: true,  dismissal: "c Kohli b Chahal" },
          { playerId: "ssmith",  playerName: "S Smith",        runs: 38, ballsFaced: 29, fours: 3, sixes: 1, strikeRate: 131.0, out: true,  dismissal: "b Hardik" },
          { playerId: "mlabusc", playerName: "M Labuschagne",  runs: 27, ballsFaced: 22, fours: 2, sixes: 1, strikeRate: 122.7, out: true,  dismissal: "c Iyer b Hardik" },
          { playerId: "gmax",    playerName: "G Maxwell",      runs: 21, ballsFaced: 11, fours: 1, sixes: 2, strikeRate: 190.9, out: true,  dismissal: "c Bumrah b Kuldeep" },
          { playerId: "mstoin",  playerName: "M Stoinis",      runs: 14, ballsFaced: 10, fours: 1, sixes: 1, strikeRate: 140.0, out: true,  dismissal: "run out (Jadeja)" },
          { playerId: "aturn",   playerName: "A Turner",       runs: 5,  ballsFaced: 4,  fours: 1, sixes: 0, strikeRate: 125.0, out: true,  dismissal: "b Siraj" },
          { playerId: "pinga",   playerName: "P Inglis",       runs: 2,  ballsFaced: 3,  fours: 0, sixes: 0, strikeRate: 66.7,  out: true,  dismissal: "c Pant b Bumrah" },
          { playerId: "mstarc",  playerName: "M Starc",        runs: 0,  ballsFaced: 1,  fours: 0, sixes: 0, strikeRate: 0.0,   out: false, dismissal: "not out" },
          { playerId: "jhazlew", playerName: "J Hazlewood",    runs: 2,  ballsFaced: 2,  fours: 0, sixes: 0, strikeRate: 100.0, out: false, dismissal: "not out" },
        ],
        bowlingCard: [
          { playerId: "jbumrah",  playerName: "J Bumrah",   oversBowled: 4, maidens: 0, runsConceded: 28, wickets: 3, economy: 7.0 },
          { playerId: "hardik",   playerName: "H Pandya",   oversBowled: 4, maidens: 0, runsConceded: 36, wickets: 2, economy: 9.0 },
          { playerId: "msiraj",   playerName: "M Siraj",    oversBowled: 4, maidens: 0, runsConceded: 42, wickets: 1, economy: 10.5 },
          { playerId: "ychahal",  playerName: "Y Chahal",   oversBowled: 4, maidens: 0, runsConceded: 32, wickets: 1, economy: 8.0 },
          { playerId: "kuldeep",  playerName: "Kuldeep Y",  oversBowled: 4, maidens: 0, runsConceded: 37, wickets: 1, economy: 9.25 },
        ],
      },
      {
        number: 2,
        battingTeam: "IND",
        bowlingTeam: "AUS",
        runs: 142,
        wickets: 3,
        overs: 16.2,
        balls: [],
        battingCard: [
          { playerId: "rsharma",  playerName: "R Sharma",   runs: 31, ballsFaced: 22, fours: 4, sixes: 1, strikeRate: 140.9, out: true,  dismissal: "c Maxwell b Starc" },
          { playerId: "sgilchr", playerName: "S Gill",      runs: 28, ballsFaced: 21, fours: 3, sixes: 1, strikeRate: 133.3, out: true,  dismissal: "c Head b Hazlewood" },
          { playerId: "vkohli",   playerName: "V Kohli",    runs: 61, ballsFaced: 42, fours: 6, sixes: 2, strikeRate: 145.2, out: false, dismissal: "not out", onStrike: true },
          { playerId: "siyer",    playerName: "S Iyer",     runs: 11, ballsFaced: 9,  fours: 1, sixes: 0, strikeRate: 122.2, out: true,  dismissal: "lbw b Maxwell" },
          { playerId: "hpandya",  playerName: "H Pandya",   runs: 11, ballsFaced: 7,  fours: 1, sixes: 1, strikeRate: 157.1, out: false, dismissal: "not out" },
        ],
        bowlingCard: [
          { playerId: "mstarc",  playerName: "M Starc",      oversBowled: 4,   maidens: 0, runsConceded: 38, wickets: 1, economy: 9.5 },
          { playerId: "jhazlew", playerName: "J Hazlewood",  oversBowled: 3,   maidens: 0, runsConceded: 26, wickets: 1, economy: 8.67 },
          { playerId: "pcum",    playerName: "P Cummins",    oversBowled: 3.2, maidens: 0, runsConceded: 29, wickets: 0, economy: 8.7 },
          { playerId: "gmax",    playerName: "G Maxwell",    oversBowled: 4,   maidens: 0, runsConceded: 34, wickets: 1, economy: 8.5 },
          { playerId: "mlabusc", playerName: "M Labuschagne",oversBowled: 2,   maidens: 0, runsConceded: 15, wickets: 0, economy: 7.5 },
        ],
      },
    ],
    liveStatusOverride: "IND 142/3 (16.2) · need 34 off 22",
    liveWinProbOverride: { teamCode: "IND", pct: 68 },
    excitement: 8,
    highlightBadge: "Series decider",
    summary: "Kohli 61* hunting the series with India needing 34 off 22 balls.",
  },
  {
    id: "eng-sa-test-2026-d3-live",
    format: "Test",
    competition: COMPETITIONS.indEngTest2026,
    matchNumber: "2nd Test · Day 3",
    startTimeIso: new Date(Date.now() - 5 * 3600000).toISOString(),
    status: "live",
    venue: { id: "lords", name: "Lord's Cricket Ground", city: "London", country: "ENG", parScore: 310, battingFirstWinPct: 0.55 },
    teamA: NATIONAL_TEAMS.ENG,
    teamB: NATIONAL_TEAMS.IND,
    toss: { winner: "IND", elected: "bat" },
    innings: [
      {
        number: 1,
        battingTeam: "IND",
        bowlingTeam: "ENG",
        runs: 450,
        wickets: 8,
        overs: 138.4,
        balls: [],
        battingCard: [
          { playerId: "rsharma",  playerName: "R Sharma",    runs: 83,  ballsFaced: 142, fours: 11, sixes: 1, strikeRate: 58.5, out: true,  dismissal: "c Root b Anderson" },
          { playerId: "sgilchr",  playerName: "S Gill",      runs: 110, ballsFaced: 189, fours: 14, sixes: 2, strikeRate: 58.2, out: true,  dismissal: "c Brook b Broad" },
          { playerId: "vkohli",   playerName: "V Kohli",     runs: 121, ballsFaced: 210, fours: 15, sixes: 0, strikeRate: 57.6, out: true,  dismissal: "lbw b Stokes" },
          { playerId: "srahane",  playerName: "A Rahane",    runs: 58,  ballsFaced: 98,  fours: 7,  sixes: 0, strikeRate: 59.2, out: true,  dismissal: "c Duckett b Anderson" },
          { playerId: "hpandya",  playerName: "H Pandya",    runs: 45,  ballsFaced: 62,  fours: 5,  sixes: 1, strikeRate: 72.6, out: true,  dismissal: "b Wood" },
          { playerId: "rpant",    playerName: "R Pant",      runs: 22,  ballsFaced: 31,  fours: 3,  sixes: 0, strikeRate: 71.0, out: false, dismissal: "not out" },
        ],
        bowlingCard: [
          { playerId: "janderson",playerName: "J Anderson",  oversBowled: 32,  maidens: 8, runsConceded: 88,  wickets: 2, economy: 2.75 },
          { playerId: "sbroad",   playerName: "S Broad",     oversBowled: 28,  maidens: 5, runsConceded: 92,  wickets: 1, economy: 3.29 },
          { playerId: "bstokes",  playerName: "B Stokes",    oversBowled: 22.4,maidens: 4, runsConceded: 76,  wickets: 1, economy: 3.35 },
          { playerId: "mwood",    playerName: "M Wood",      oversBowled: 26,  maidens: 2, runsConceded: 98,  wickets: 1, economy: 3.77 },
          { playerId: "jleach",   playerName: "J Leach",     oversBowled: 30,  maidens: 3, runsConceded: 96,  wickets: 0, economy: 3.2 },
        ],
      },
      {
        number: 2,
        battingTeam: "ENG",
        bowlingTeam: "IND",
        runs: 199,
        wickets: 10,
        overs: 58.3,
        balls: [],
        battingCard: [
          { playerId: "zcrwly",   playerName: "Z Crawley",   runs: 45,  ballsFaced: 62,  fours: 7, sixes: 0, strikeRate: 72.6, out: true,  dismissal: "c Kohli b Bumrah" },
          { playerId: "bduckett", playerName: "B Duckett",   runs: 18,  ballsFaced: 24,  fours: 3, sixes: 0, strikeRate: 75.0, out: true,  dismissal: "lbw b Siraj" },
          { playerId: "jroot",    playerName: "J Root",      runs: 68,  ballsFaced: 112, fours: 8, sixes: 0, strikeRate: 60.7, out: true,  dismissal: "c Pant b Jadeja" },
          { playerId: "hbrook",   playerName: "H Brook",     runs: 29,  ballsFaced: 41,  fours: 4, sixes: 1, strikeRate: 70.7, out: true,  dismissal: "b Kuldeep" },
          { playerId: "bstokes",  playerName: "B Stokes",    runs: 22,  ballsFaced: 38,  fours: 2, sixes: 0, strikeRate: 57.9, out: true,  dismissal: "c Rahane b Bumrah" },
          { playerId: "jbairst",  playerName: "J Bairstow",  runs: 9,   ballsFaced: 15,  fours: 1, sixes: 0, strikeRate: 60.0, out: true,  dismissal: "c sub b Jadeja" },
          { playerId: "mliving",  playerName: "M Livingstone",runs: 5,  ballsFaced: 8,   fours: 0, sixes: 0, strikeRate: 62.5, out: true,  dismissal: "b Hardik" },
          { playerId: "cwokes",   playerName: "C Woakes",    runs: 3,   ballsFaced: 7,   fours: 0, sixes: 0, strikeRate: 42.9, out: true,  dismissal: "b Bumrah" },
        ],
        bowlingCard: [
          { playerId: "jbumrah",  playerName: "J Bumrah",    oversBowled: 16, maidens: 4, runsConceded: 42, wickets: 3, economy: 2.63 },
          { playerId: "msiraj",   playerName: "M Siraj",     oversBowled: 14, maidens: 2, runsConceded: 51, wickets: 1, economy: 3.64 },
          { playerId: "rrjadeja", playerName: "R Jadeja",    oversBowled: 16, maidens: 3, runsConceded: 56, wickets: 2, economy: 3.5 },
          { playerId: "kuldeep",  playerName: "Kuldeep Y",   oversBowled: 12, maidens: 1, runsConceded: 46, wickets: 1, economy: 3.83 },
          { playerId: "hpandya",  playerName: "H Pandya",    oversBowled: 0.3,maidens: 0, runsConceded: 4,  wickets: 1, economy: 8.0 },
        ],
      },
      {
        number: 3,
        battingTeam: "ENG",
        bowlingTeam: "IND",
        runs: 88,
        wickets: 4,
        overs: 28.0,
        balls: [],
        battingCard: [
          { playerId: "zcrwly",   playerName: "Z Crawley",   runs: 12,  ballsFaced: 18,  fours: 2, sixes: 0, strikeRate: 66.7, out: true,  dismissal: "c Kohli b Bumrah" },
          { playerId: "bduckett", playerName: "B Duckett",   runs: 31,  ballsFaced: 44,  fours: 5, sixes: 1, strikeRate: 70.5, out: true,  dismissal: "b Jadeja" },
          { playerId: "jroot",    playerName: "J Root",      runs: 28,  ballsFaced: 52,  fours: 3, sixes: 0, strikeRate: 53.8, out: false, dismissal: "not out", onStrike: true },
          { playerId: "hbrook",   playerName: "H Brook",     runs: 9,   ballsFaced: 16,  fours: 1, sixes: 0, strikeRate: 56.3, out: true,  dismissal: "lbw b Kuldeep" },
          { playerId: "bstokes",  playerName: "B Stokes",    runs: 4,   ballsFaced: 12,  fours: 0, sixes: 0, strikeRate: 33.3, out: true,  dismissal: "c Pant b Siraj" },
          { playerId: "jbairst",  playerName: "J Bairstow",  runs: 4,   ballsFaced: 9,   fours: 0, sixes: 0, strikeRate: 44.4, out: false, dismissal: "not out" },
        ],
        bowlingCard: [
          { playerId: "jbumrah",  playerName: "J Bumrah",    oversBowled: 8,  maidens: 2, runsConceded: 18, wickets: 1, economy: 2.25 },
          { playerId: "msiraj",   playerName: "M Siraj",     oversBowled: 7,  maidens: 1, runsConceded: 25, wickets: 1, economy: 3.57 },
          { playerId: "rrjadeja", playerName: "R Jadeja",    oversBowled: 9,  maidens: 2, runsConceded: 28, wickets: 1, economy: 3.11 },
          { playerId: "kuldeep",  playerName: "Kuldeep Y",   oversBowled: 4,  maidens: 0, runsConceded: 17, wickets: 1, economy: 4.25 },
        ],
      },
    ],
    liveStatusOverride: "ENG 2nd inn: 88/4 · trail by 163",
    liveWinProbOverride: { teamCode: "IND", pct: 74 },
    excitement: 9,
    highlightBadge: "Test · Day 3",
    summary: "India lead by 163 with England 4 down — Bazball under scrutiny.",
  },
  {
    id: "psl-2026-lah-kar-live",
    format: "T20",
    competition: COMPETITIONS.psl2026,
    matchNumber: "Match 18",
    startTimeIso: new Date(Date.now() - 1.5 * 3600000).toISOString(),
    status: "live",
    venue: { id: "gaddafi", name: "Gaddafi Stadium", city: "Lahore", country: "PAK", parScore: 162, battingFirstWinPct: 0.52 },
    teamA: LEAGUE_TEAMS.LAH,
    teamB: LEAGUE_TEAMS.KAR,
    toss: { winner: "KAR", elected: "bowl" },
    innings: [
      {
        number: 1,
        battingTeam: "KAR",
        bowlingTeam: "LAH",
        runs: 165,
        wickets: 7,
        overs: 20,
        balls: [],
        battingCard: [
          { playerId: "sbabr",   playerName: "S Babar",    runs: 52, ballsFaced: 38, fours: 6, sixes: 1, strikeRate: 136.8, out: true,  dismissal: "c Fakhar b Shaheen" },
          { playerId: "mrizwan", playerName: "M Rizwan",   runs: 41, ballsFaced: 33, fours: 4, sixes: 1, strikeRate: 124.2, out: true,  dismissal: "c sub b Rashid" },
          { playerId: "ifazal",  playerName: "I Fazal",    runs: 28, ballsFaced: 20, fours: 2, sixes: 2, strikeRate: 140.0, out: true,  dismissal: "b Haris" },
          { playerId: "smohsin", playerName: "S Mohsin",   runs: 21, ballsFaced: 16, fours: 2, sixes: 1, strikeRate: 131.3, out: true,  dismissal: "run out" },
          { playerId: "aimam",   playerName: "A Imad",     runs: 14, ballsFaced: 11, fours: 1, sixes: 1, strikeRate: 127.3, out: false, dismissal: "not out" },
        ],
        bowlingCard: [
          { playerId: "shaheenl",playerName: "Shaheen Shah",oversBowled: 4, maidens: 0, runsConceded: 32, wickets: 2, economy: 8.0 },
          { playerId: "haris",   playerName: "Haris Rauf",   oversBowled: 4, maidens: 0, runsConceded: 38, wickets: 1, economy: 9.5 },
          { playerId: "rashid",  playerName: "Rashid Khan",  oversBowled: 4, maidens: 0, runsConceded: 34, wickets: 1, economy: 8.5 },
          { playerId: "fakhar",  playerName: "Fakhar Zaman", oversBowled: 4, maidens: 0, runsConceded: 31, wickets: 0, economy: 7.75 },
          { playerId: "naseem",  playerName: "Naseem Shah",  oversBowled: 4, maidens: 0, runsConceded: 30, wickets: 0, economy: 7.5 },
        ],
      },
      {
        number: 2,
        battingTeam: "LAH",
        bowlingTeam: "KAR",
        runs: 138,
        wickets: 5,
        overs: 17,
        balls: [],
        battingCard: [
          { playerId: "fzaman",  playerName: "Fakhar Zaman", runs: 47, ballsFaced: 34, fours: 5, sixes: 2, strikeRate: 138.2, out: true,  dismissal: "c Rizwan b Imad" },
          { playerId: "babarzam",playerName: "Babar Azam",   runs: 38, ballsFaced: 30, fours: 4, sixes: 1, strikeRate: 126.7, out: true,  dismissal: "b Naseem" },
          { playerId: "shadab",  playerName: "Shadab Khan",  runs: 22, ballsFaced: 16, fours: 2, sixes: 1, strikeRate: 137.5, out: true,  dismissal: "c Fazal b Babar" },
          { playerId: "arshad",  playerName: "Arshad Iqbal", runs: 18, ballsFaced: 14, fours: 1, sixes: 1, strikeRate: 128.6, out: false, dismissal: "not out", onStrike: true },
          { playerId: "haris2",  playerName: "Haris Rauf",   runs: 8,  ballsFaced: 7,  fours: 1, sixes: 0, strikeRate: 114.3, out: true,  dismissal: "b Hasan" },
          { playerId: "zakhter", playerName: "Zaman Khan",   runs: 5,  ballsFaced: 4,  fours: 1, sixes: 0, strikeRate: 125.0, out: false, dismissal: "not out" },
        ],
        bowlingCard: [
          { playerId: "sbabr",   playerName: "S Babar",      oversBowled: 3,  maidens: 0, runsConceded: 22, wickets: 1, economy: 7.33 },
          { playerId: "naseem",  playerName: "Naseem Shah",   oversBowled: 4,  maidens: 0, runsConceded: 31, wickets: 1, economy: 7.75 },
          { playerId: "aimam",   playerName: "A Imad",        oversBowled: 4,  maidens: 0, runsConceded: 28, wickets: 1, economy: 7.0 },
          { playerId: "hasan",   playerName: "Hasan Ali",     oversBowled: 3,  maidens: 0, runsConceded: 27, wickets: 1, economy: 9.0 },
          { playerId: "smohsin2",playerName: "S Mohsin",      oversBowled: 3,  maidens: 0, runsConceded: 30, wickets: 0, economy: 10.0 },
        ],
      },
    ],
    liveStatusOverride: "LAH 138/5 (17.0) · 28 needed off 18",
    liveWinProbOverride: { teamCode: "LAH", pct: 55 },
    excitement: 7,
    summary: "Clash of rivals — Lahore and Karachi neck and neck in a low-scoring thriller.",
  },
];

export const PAST_INTERNATIONAL: Match[] = [
  {
    id: "t20wc-2026-ind-pak",
    format: "T20I",
    competition: COMPETITIONS.t20wc2026,
    matchNumber: "Super 8 · Match 3",
    startTimeIso: new Date(Date.now() - 60 * 3600000).toISOString(),
    status: "post-match",
    venue: { id: "nassau", name: "Nassau County International Cricket Stadium", city: "New York", country: "USA", parScore: 148 },
    teamA: NATIONAL_TEAMS.IND,
    teamB: NATIONAL_TEAMS.PAK,
    toss: { winner: "PAK", elected: "bowl" },
    innings: [
      {
        number: 1, battingTeam: "PAK", bowlingTeam: "IND", runs: 149, wickets: 10, overs: 19.4, balls: [],
        battingCard: [
          { playerId: "mbabr",    playerName: "M Babar",    runs: 44, ballsFaced: 38, fours: 5, sixes: 0, strikeRate: 115.8, out: true,  dismissal: "c Kohli b Bumrah" },
          { playerId: "mrizwan2", playerName: "M Rizwan",   runs: 31, ballsFaced: 28, fours: 3, sixes: 1, strikeRate: 110.7, out: true,  dismissal: "run out (Jadeja)" },
          { playerId: "mkhan",    playerName: "M Khan",     runs: 29, ballsFaced: 22, fours: 2, sixes: 2, strikeRate: 131.8, out: true,  dismissal: "b Hardik" },
          { playerId: "sfakhar",  playerName: "F Zaman",    runs: 19, ballsFaced: 16, fours: 2, sixes: 0, strikeRate: 118.8, out: true,  dismissal: "c Pant b Kuldeep" },
          { playerId: "shadab2",  playerName: "Shadab K",   runs: 14, ballsFaced: 9,  fours: 0, sixes: 1, strikeRate: 155.6, out: true,  dismissal: "b Bumrah" },
          { playerId: "has2",     playerName: "Hasan Ali",  runs:  8, ballsFaced: 7,  fours: 1, sixes: 0, strikeRate: 114.3, out: true,  dismissal: "c sub b Siraj" },
          { playerId: "nah",      playerName: "N Shah",     runs:  4, ballsFaced: 5,  fours: 0, sixes: 0, strikeRate: 80.0,  out: true,  dismissal: "b Bumrah" },
        ],
        bowlingCard: [
          { playerId: "jbumrah",  playerName: "J Bumrah",   oversBowled: 3.4, maidens: 0, runsConceded: 22, wickets: 3, economy: 6.0 },
          { playerId: "hardik2",  playerName: "H Pandya",   oversBowled: 4,   maidens: 0, runsConceded: 33, wickets: 1, economy: 8.25 },
          { playerId: "siraj2",   playerName: "M Siraj",    oversBowled: 4,   maidens: 0, runsConceded: 37, wickets: 1, economy: 9.25 },
          { playerId: "kuldeep2", playerName: "Kuldeep Y",  oversBowled: 4,   maidens: 0, runsConceded: 28, wickets: 1, economy: 7.0 },
          { playerId: "jadeja2",  playerName: "R Jadeja",   oversBowled: 4,   maidens: 0, runsConceded: 29, wickets: 0, economy: 7.25 },
        ],
      },
      {
        number: 2, battingTeam: "IND", bowlingTeam: "PAK", runs: 152, wickets: 4, overs: 19.3, balls: [],
        battingCard: [
          { playerId: "rsharma2", playerName: "R Sharma",   runs: 52, ballsFaced: 29, fours: 6, sixes: 3, strikeRate: 179.3, out: true,  dismissal: "c Babar b Naseem" },
          { playerId: "sgill2",   playerName: "S Gill",     runs: 18, ballsFaced: 15, fours: 2, sixes: 1, strikeRate: 120.0, out: true,  dismissal: "b Haris" },
          { playerId: "vkohli2",  playerName: "V Kohli",    runs: 43, ballsFaced: 31, fours: 4, sixes: 2, strikeRate: 138.7, out: false, dismissal: "not out" },
          { playerId: "siyer2",   playerName: "S Iyer",     runs: 22, ballsFaced: 18, fours: 2, sixes: 1, strikeRate: 122.2, out: true,  dismissal: "c Rizwan b Shadab" },
          { playerId: "rpant2",   playerName: "R Pant",     runs: 14, ballsFaced: 9,  fours: 1, sixes: 1, strikeRate: 155.6, out: true,  dismissal: "run out" },
          { playerId: "hpand2",   playerName: "H Pandya",   runs:  3, ballsFaced: 2,  fours: 0, sixes: 0, strikeRate: 150.0, out: false, dismissal: "not out" },
        ],
        bowlingCard: [
          { playerId: "nas2",  playerName: "Naseem S",  oversBowled: 4,   maidens: 0, runsConceded: 36, wickets: 1, economy: 9.0 },
          { playerId: "har2",  playerName: "Haris R",   oversBowled: 4,   maidens: 0, runsConceded: 38, wickets: 1, economy: 9.5 },
          { playerId: "shad2", playerName: "Shadab K",  oversBowled: 3.3, maidens: 0, runsConceded: 31, wickets: 1, economy: 8.86 },
          { playerId: "im2",   playerName: "Imad W",    oversBowled: 4,   maidens: 0, runsConceded: 28, wickets: 0, economy: 7.0 },
          { playerId: "har3",  playerName: "Hasan A",   oversBowled: 4,   maidens: 0, runsConceded: 19, wickets: 0, economy: 4.75 },
        ],
      },
    ],
    result: { winner: "IND", margin: "by 6 wickets", teamARuns: 152, teamBRuns: 149 },
    excitement: 10,
    highlightBadge: "India won",
    summary: "Rohit's 52 off 29 set up the chase as India overcame a tense Pakistan total in the last over.",
  },
  {
    id: "ct-2025-aus-nz-final",
    format: "ODI",
    competition: COMPETITIONS.ct2025,
    matchNumber: "Final",
    startTimeIso: new Date(Date.now() - 96 * 3600000).toISOString(),
    status: "post-match",
    venue: { id: "lahore-gaddafi", name: "Gaddafi Stadium", city: "Lahore", country: "PAK", parScore: 260 },
    teamA: NATIONAL_TEAMS.AUS,
    teamB: NATIONAL_TEAMS.NZ,
    toss: { winner: "AUS", elected: "bat" },
    innings: [
      {
        number: 1, battingTeam: "AUS", bowlingTeam: "NZ", runs: 312, wickets: 7, overs: 50, balls: [],
        battingCard: [
          { playerId: "twrna",  playerName: "T Warner",    runs: 44,  ballsFaced: 51,  fours: 5, sixes: 1, strikeRate: 86.3,  out: true,  dismissal: "c Williamson b Boult" },
          { playerId: "thead2", playerName: "T Head",      runs: 71,  ballsFaced: 79,  fours: 8, sixes: 2, strikeRate: 89.9,  out: true,  dismissal: "lbw b Southee" },
          { playerId: "ssmith2",playerName: "S Smith",     runs: 118, ballsFaced: 128, fours:13, sixes: 3, strikeRate: 92.2,  out: true,  dismissal: "c Phillips b Henry" },
          { playerId: "mmarsh", playerName: "M Marsh",     runs: 44,  ballsFaced: 48,  fours: 4, sixes: 1, strikeRate: 91.7,  out: true,  dismissal: "run out (Conway)" },
          { playerId: "gmax2",  playerName: "G Maxwell",   runs: 21,  ballsFaced: 14,  fours: 1, sixes: 2, strikeRate: 150.0, out: true,  dismissal: "c sub b Boult" },
          { playerId: "mstoin2",playerName: "M Stoinis",   runs:  9,  ballsFaced: 11,  fours: 1, sixes: 0, strikeRate: 81.8,  out: false, dismissal: "not out" },
        ],
        bowlingCard: [
          { playerId: "tboult",     playerName: "T Boult",       oversBowled: 10, maidens: 1, runsConceded: 58, wickets: 2, economy: 5.8 },
          { playerId: "tsouth",     playerName: "T Southee",     oversBowled: 10, maidens: 0, runsConceded: 64, wickets: 1, economy: 6.4 },
          { playerId: "mhenry",     playerName: "M Henry",       oversBowled: 10, maidens: 0, runsConceded: 68, wickets: 1, economy: 6.8 },
          { playerId: "mbracewell", playerName: "M Bracewell",   oversBowled: 10, maidens: 0, runsConceded: 62, wickets: 0, economy: 6.2 },
          { playerId: "kwill",      playerName: "K Williamson",  oversBowled:  6, maidens: 0, runsConceded: 38, wickets: 0, economy: 6.33 },
          { playerId: "jduffy",     playerName: "J Duffy",       oversBowled:  4, maidens: 0, runsConceded: 22, wickets: 0, economy: 5.5 },
        ],
      },
      {
        number: 2, battingTeam: "NZ", bowlingTeam: "AUS", runs: 269, wickets: 10, overs: 47.2, balls: [],
        battingCard: [
          { playerId: "conway",  playerName: "D Conway",      runs: 72, ballsFaced: 84,  fours: 7, sixes: 1, strikeRate: 85.7,  out: true,  dismissal: "c Head b Cummins" },
          { playerId: "kwill2",  playerName: "K Williamson",  runs: 88, ballsFaced: 101, fours: 9, sixes: 2, strikeRate: 87.1,  out: true,  dismissal: "c Warner b Starc" },
          { playerId: "gnich",   playerName: "G Nicholls",    runs: 41, ballsFaced: 52,  fours: 4, sixes: 0, strikeRate: 78.8,  out: true,  dismissal: "lbw b Hazlewood" },
          { playerId: "tlath",   playerName: "T Latham",      runs: 28, ballsFaced: 34,  fours: 3, sixes: 0, strikeRate: 82.4,  out: true,  dismissal: "c Maxwell b Cummins" },
          { playerId: "gphil",   playerName: "G Phillips",    runs: 21, ballsFaced: 18,  fours: 2, sixes: 1, strikeRate: 116.7, out: true,  dismissal: "b Starc" },
          { playerId: "mbrce",   playerName: "M Bracewell",   runs: 13, ballsFaced: 17,  fours: 1, sixes: 0, strikeRate: 76.5,  out: true,  dismissal: "b Maxwell" },
        ],
        bowlingCard: [
          { playerId: "mstarc2", playerName: "M Starc",      oversBowled:  9.2, maidens: 0, runsConceded: 51, wickets: 2, economy: 5.46 },
          { playerId: "jcumm",   playerName: "P Cummins",    oversBowled: 10,   maidens: 1, runsConceded: 48, wickets: 2, economy: 4.8 },
          { playerId: "jhazl2",  playerName: "J Hazlewood",  oversBowled: 10,   maidens: 1, runsConceded: 52, wickets: 1, economy: 5.2 },
          { playerId: "gmax3",   playerName: "G Maxwell",    oversBowled: 10,   maidens: 0, runsConceded: 64, wickets: 1, economy: 6.4 },
          { playerId: "aagr",    playerName: "A Agar",       oversBowled:  8,   maidens: 0, runsConceded: 54, wickets: 0, economy: 6.75 },
        ],
      },
    ],
    result: { winner: "AUS", margin: "by 43 runs", teamARuns: 312, teamBRuns: 269 },
    excitement: 8,
    highlightBadge: "AUS Champions",
    summary: "Smith's 118 laid the foundation as Australia clinched their third Champions Trophy title.",
  },
  {
    id: "ashes-2526-3rd-test",
    format: "Test",
    competition: COMPETITIONS.ashes2526,
    matchNumber: "3rd Test",
    startTimeIso: new Date(Date.now() - 120 * 3600000).toISOString(),
    status: "post-match",
    venue: { id: "mcg", name: "Melbourne Cricket Ground", city: "Melbourne", country: "AUS", parScore: 330 },
    teamA: NATIONAL_TEAMS.AUS,
    teamB: NATIONAL_TEAMS.ENG,
    toss: { winner: "ENG", elected: "bat" },
    innings: [
      {
        number: 1, battingTeam: "ENG", bowlingTeam: "AUS", runs: 210, wickets: 10, overs: 56.4, balls: [],
        battingCard: [
          { playerId: "zcraw2",   playerName: "Z Crawley",   runs: 34, ballsFaced: 51, fours: 5, sixes: 0, strikeRate: 66.7, out: true,  dismissal: "c Smith b Hazlewood" },
          { playerId: "bduck2",   playerName: "B Duckett",   runs: 41, ballsFaced: 58, fours: 6, sixes: 1, strikeRate: 70.7, out: true,  dismissal: "lbw b Starc" },
          { playerId: "jroot2",   playerName: "J Root",      runs: 62, ballsFaced: 89, fours: 8, sixes: 0, strikeRate: 69.7, out: true,  dismissal: "c Warner b Cummins" },
          { playerId: "hbrook2",  playerName: "H Brook",     runs: 29, ballsFaced: 38, fours: 4, sixes: 0, strikeRate: 76.3, out: true,  dismissal: "b Hazlewood" },
          { playerId: "bstok2",   playerName: "B Stokes",    runs: 22, ballsFaced: 34, fours: 2, sixes: 1, strikeRate: 64.7, out: true,  dismissal: "c Inglis b Lyon" },
          { playerId: "jbairst2", playerName: "J Bairstow",  runs: 11, ballsFaced: 18, fours: 1, sixes: 0, strikeRate: 61.1, out: true,  dismissal: "b Starc" },
          { playerId: "cwkes",    playerName: "C Woakes",    runs:  7, ballsFaced: 12, fours: 1, sixes: 0, strikeRate: 58.3, out: true,  dismissal: "lbw b Cummins" },
        ],
        bowlingCard: [
          { playerId: "jhazel2", playerName: "J Hazlewood",  oversBowled: 14,   maidens: 4, runsConceded: 38, wickets: 3, economy: 2.71 },
          { playerId: "mstarc3", playerName: "M Starc",      oversBowled: 14,   maidens: 2, runsConceded: 52, wickets: 2, economy: 3.71 },
          { playerId: "pcumm2",  playerName: "P Cummins",    oversBowled: 14,   maidens: 3, runsConceded: 51, wickets: 2, economy: 3.64 },
          { playerId: "nlyon",   playerName: "N Lyon",       oversBowled: 14.4, maidens: 1, runsConceded: 69, wickets: 1, economy: 4.71 },
        ],
      },
      {
        number: 2, battingTeam: "AUS", bowlingTeam: "ENG", runs: 512, wickets: 8, overs: 140.2, balls: [],
        battingCard: [
          { playerId: "dwarner2", playerName: "D Warner",   runs: 142, ballsFaced: 232, fours: 18, sixes: 2, strikeRate: 61.2, out: true,  dismissal: "c Root b Anderson" },
          { playerId: "thead3",   playerName: "T Head",     runs:  88, ballsFaced: 121, fours: 10, sixes: 3, strikeRate: 72.7, out: true,  dismissal: "c Duckett b Wood" },
          { playerId: "ssmith3",  playerName: "S Smith",    runs: 101, ballsFaced: 178, fours: 11, sixes: 1, strikeRate: 56.7, out: true,  dismissal: "b Broad" },
          { playerId: "mmarsh2",  playerName: "M Marsh",    runs:  72, ballsFaced: 98,  fours:  9, sixes: 0, strikeRate: 73.5, out: true,  dismissal: "c Bairstow b Stokes" },
          { playerId: "gmax4",    playerName: "G Maxwell",  runs:  54, ballsFaced: 68,  fours:  7, sixes: 1, strikeRate: 79.4, out: false, dismissal: "not out" },
          { playerId: "aturn2",   playerName: "A Turner",   runs:  28, ballsFaced: 42,  fours:  3, sixes: 0, strikeRate: 66.7, out: false, dismissal: "not out" },
        ],
        bowlingCard: [
          { playerId: "jande2",  playerName: "J Anderson",  oversBowled: 36,   maidens: 8, runsConceded: 102, wickets: 2, economy: 2.83 },
          { playerId: "sbroad2", playerName: "S Broad",     oversBowled: 34,   maidens: 6, runsConceded:  98, wickets: 2, economy: 2.88 },
          { playerId: "bstok3",  playerName: "B Stokes",    oversBowled: 28,   maidens: 3, runsConceded: 101, wickets: 1, economy: 3.61 },
          { playerId: "mwood2",  playerName: "M Wood",      oversBowled: 26,   maidens: 2, runsConceded: 108, wickets: 1, economy: 4.15 },
          { playerId: "jleach2", playerName: "J Leach",     oversBowled: 16,   maidens: 1, runsConceded: 103, wickets: 0, economy: 6.44 },
        ],
      },
      {
        number: 3, battingTeam: "ENG", bowlingTeam: "AUS", runs: 275, wickets: 10, overs: 72.1, balls: [],
        battingCard: [
          { playerId: "zcraw3",   playerName: "Z Crawley",  runs: 51, ballsFaced: 77,  fours: 7, sixes: 0, strikeRate: 66.2, out: true,  dismissal: "c Smith b Hazlewood" },
          { playerId: "bduck3",   playerName: "B Duckett",  runs: 68, ballsFaced: 102, fours: 8, sixes: 2, strikeRate: 66.7, out: true,  dismissal: "lbw b Lyon" },
          { playerId: "jroot3",   playerName: "J Root",     runs: 44, ballsFaced: 74,  fours: 5, sixes: 0, strikeRate: 59.5, out: true,  dismissal: "c Head b Starc" },
          { playerId: "hbrook3",  playerName: "H Brook",    runs: 38, ballsFaced: 51,  fours: 4, sixes: 1, strikeRate: 74.5, out: true,  dismissal: "c Warner b Cummins" },
          { playerId: "bstok4",   playerName: "B Stokes",   runs: 41, ballsFaced: 59,  fours: 5, sixes: 0, strikeRate: 69.5, out: true,  dismissal: "b Hazlewood" },
          { playerId: "jbairst3", playerName: "J Bairstow", runs: 19, ballsFaced: 28,  fours: 2, sixes: 0, strikeRate: 67.9, out: true,  dismissal: "b Lyon" },
        ],
        bowlingCard: [
          { playerId: "jhazel3", playerName: "J Hazlewood",  oversBowled: 18,   maidens: 4, runsConceded: 62, wickets: 3, economy: 3.44 },
          { playerId: "mstarc4", playerName: "M Starc",      oversBowled: 16,   maidens: 2, runsConceded: 69, wickets: 1, economy: 4.31 },
          { playerId: "nlyon2",  playerName: "N Lyon",       oversBowled: 22.1, maidens: 5, runsConceded: 78, wickets: 2, economy: 3.52 },
          { playerId: "pcumm3",  playerName: "P Cummins",    oversBowled: 16,   maidens: 3, runsConceded: 66, wickets: 1, economy: 4.13 },
        ],
      },
    ],
    result: { winner: "AUS", margin: "by an innings and 27 runs", teamARuns: 512, teamBRuns: 210 },
    excitement: 7,
    summary: "Warner's farewell ton and a hostile McGrath-like spell from Hazlewood buried England in three days.",
  },
  {
    id: "bbl-2526-scorchers-sixers",
    format: "T20",
    competition: COMPETITIONS.bbl2526,
    matchNumber: "Final",
    startTimeIso: new Date(Date.now() - 48 * 3600000).toISOString(),
    status: "post-match",
    venue: { id: "optus", name: "Optus Stadium", city: "Perth", country: "AUS", parScore: 166 },
    teamA: LEAGUE_TEAMS.SCORCHERS,
    teamB: LEAGUE_TEAMS.SIXERS,
    toss: { winner: "SIXERS", elected: "bowl" },
    innings: [
      {
        number: 1,
        battingTeam: "SCORCHERS",
        bowlingTeam: "SIXERS",
        runs: 177,
        wickets: 6,
        overs: 20,
        balls: [],
        battingCard: [
          { playerId: "dcameron", playerName: "D Cameron",  runs: 58, ballsFaced: 39, fours: 6, sixes: 3, strikeRate: 148.7, out: true,  dismissal: "c Henriques b Abbott" },
          { playerId: "cingram",  playerName: "C Ingram",   runs: 44, ballsFaced: 31, fours: 4, sixes: 2, strikeRate: 141.9, out: true,  dismissal: "run out" },
          { playerId: "mkellek",  playerName: "M Kellek",   runs: 29, ballsFaced: 18, fours: 2, sixes: 2, strikeRate: 161.1, out: true,  dismissal: "c Abbott b Dwarshuis" },
          { playerId: "plawrence",playerName: "P Lawrence", runs: 32, ballsFaced: 17, fours: 2, sixes: 3, strikeRate: 188.2, out: false, dismissal: "not out" },
          { playerId: "aagarwal2",playerName: "A Agarwal",  runs: 8,  ballsFaced: 7,  fours: 1, sixes: 0, strikeRate: 114.3, out: true,  dismissal: "b Kerr" },
          { playerId: "ansje",    playerName: "A Nortje",   runs: 3,  ballsFaced: 3,  fours: 0, sixes: 0, strikeRate: 100.0, out: false, dismissal: "not out" },
        ],
        bowlingCard: [
          { playerId: "sabbott",  playerName: "S Abbott",   oversBowled: 4, maidens: 0, runsConceded: 34, wickets: 1, economy: 8.5 },
          { playerId: "bdwars",   playerName: "B Dwarshuis",oversBowled: 4, maidens: 0, runsConceded: 38, wickets: 1, economy: 9.5 },
          { playerId: "skerr",    playerName: "S Kerr",     oversBowled: 4, maidens: 0, runsConceded: 41, wickets: 1, economy: 10.25 },
          { playerId: "mhenriqu", playerName: "M Henriques",oversBowled: 4, maidens: 0, runsConceded: 36, wickets: 0, economy: 9.0 },
          { playerId: "twalter",  playerName: "T Walter",   oversBowled: 4, maidens: 0, runsConceded: 28, wickets: 0, economy: 7.0 },
        ],
      },
      {
        number: 2,
        battingTeam: "SIXERS",
        bowlingTeam: "SCORCHERS",
        runs: 169,
        wickets: 10,
        overs: 19.4,
        balls: [],
        battingCard: [
          { playerId: "mhendricks",playerName: "M Henriques",runs: 61,ballsFaced: 44, fours: 7, sixes: 2, strikeRate: 138.6, out: true,  dismissal: "c Cameron b Nortje" },
          { playerId: "jvince",    playerName: "J Vince",    runs: 38, ballsFaced: 28, fours: 4, sixes: 2, strikeRate: 135.7, out: true,  dismissal: "b Lawrence" },
          { playerId: "djordan",   playerName: "D Jordan",   runs: 27, ballsFaced: 19, fours: 2, sixes: 2, strikeRate: 142.1, out: true,  dismissal: "c sub b Ingram" },
          { playerId: "sphill",    playerName: "S Philippe",  runs: 22, ballsFaced: 17, fours: 2, sixes: 1, strikeRate: 129.4, out: true,  dismissal: "lbw b Nortje" },
          { playerId: "bkerr",     playerName: "B Kerr",     runs: 11, ballsFaced: 10, fours: 1, sixes: 0, strikeRate: 110.0, out: true,  dismissal: "c Cameron b Lawrence" },
          { playerId: "sabbott2",  playerName: "S Abbott",   runs: 5,  ballsFaced: 5,  fours: 1, sixes: 0, strikeRate: 100.0, out: true,  dismissal: "b Hardie" },
        ],
        bowlingCard: [
          { playerId: "anortje",   playerName: "A Nortje",   oversBowled: 4,   maidens: 0, runsConceded: 28, wickets: 2, economy: 7.0 },
          { playerId: "plawrence2",playerName: "P Lawrence", oversBowled: 3.4, maidens: 0, runsConceded: 31, wickets: 2, economy: 8.45 },
          { playerId: "dcameron2", playerName: "D Cameron",  oversBowled: 4,   maidens: 0, runsConceded: 36, wickets: 0, economy: 9.0 },
          { playerId: "cingram2",  playerName: "C Ingram",   oversBowled: 4,   maidens: 0, runsConceded: 42, wickets: 1, economy: 10.5 },
          { playerId: "bhardie",   playerName: "B Hardie",   oversBowled: 4,   maidens: 0, runsConceded: 32, wickets: 1, economy: 8.0 },
        ],
      },
    ],
    result: { winner: "SCORCHERS", margin: "by 8 runs", teamARuns: 177, teamBRuns: 169 },
    excitement: 8,
    highlightBadge: "BBL Final",
    summary: "Lawrence smashed 3 sixes in the final over to help Scorchers defend 177 in a BBL classic.",
  },
];

export const UPCOMING_INTERNATIONAL: Match[] = [
  {
    id: "ind-aus-t20i-2026-m3",
    format: "T20I",
    competition: COMPETITIONS.indAusT20i2026,
    matchNumber: "3rd T20I",
    startTimeIso: new Date(Date.now() + 26 * 3600000).toISOString(),
    status: "upcoming",
    venue: { id: "mcg", name: "Melbourne Cricket Ground", city: "Melbourne", country: "AUS", parScore: 171 },
    teamA: NATIONAL_TEAMS.AUS,
    teamB: NATIONAL_TEAMS.IND,
    innings: [],
    excitement: 9,
    summary: "Series decider with the T20 World Cup six weeks away — every player fighting for their spot.",
  },
  {
    id: "eng-sa-odi-2026-m2",
    format: "ODI",
    competition: COMPETITIONS.engSaOdi2026,
    matchNumber: "2nd ODI",
    startTimeIso: new Date(Date.now() + 14 * 3600000).toISOString(),
    status: "upcoming",
    venue: { id: "headingley", name: "Headingley", city: "Leeds", country: "ENG", parScore: 268 },
    teamA: NATIONAL_TEAMS.ENG,
    teamB: NATIONAL_TEAMS.SA,
    innings: [],
    excitement: 6,
    summary: "England look to level after SA's comprehensive win at The Oval.",
  },
  {
    id: "psl-2026-mul-pes",
    format: "T20",
    competition: COMPETITIONS.psl2026,
    matchNumber: "Match 19",
    startTimeIso: new Date(Date.now() + 6 * 3600000).toISOString(),
    status: "upcoming",
    venue: { id: "national", name: "National Stadium", city: "Karachi", country: "PAK", parScore: 158 },
    teamA: LEAGUE_TEAMS.MUL,
    teamB: LEAGUE_TEAMS.PES,
    innings: [],
    excitement: 6,
    summary: "Multan Sultans defending PSL title against a Peshawar Zalmi side that's hit form late.",
  },
  {
    id: "hundred-2026-ovi-lsp",
    format: "T20",
    competition: COMPETITIONS.hundred2026,
    matchNumber: "Match 11",
    startTimeIso: new Date(Date.now() + 32 * 3600000).toISOString(),
    status: "upcoming",
    venue: { id: "oval", name: "The Kia Oval", city: "London", country: "ENG", parScore: 152 },
    teamA: LEAGUE_TEAMS.OVI,
    teamB: LEAGUE_TEAMS.LSP,
    innings: [],
    excitement: 7,
    summary: "London derby with Stokes leading London Spirit in a must-win against the table-toppers.",
  },
  {
    id: "mlc-2026-lakr-tsk",
    format: "T20",
    competition: COMPETITIONS.mlc2026,
    matchNumber: "Match 8",
    startTimeIso: new Date(Date.now() + 18 * 3600000).toISOString(),
    status: "upcoming",
    venue: { id: "gs", name: "Grand Prairie Stadium", city: "Dallas", country: "USA", parScore: 155 },
    teamA: LEAGUE_TEAMS.LAKR,
    teamB: LEAGUE_TEAMS.TSK,
    innings: [],
    excitement: 5,
    summary: "KKR vs CSK brands meet in Texas — MLC's marquee rivalry drawing huge US viewership.",
  },
];

// ============================================================================
// Combined all-cricket exports for the home page
// ============================================================================

export const ALL_LIVE_MATCHES: Match[] = [
  ...LIVE_MATCHES,
  ...LIVE_INTERNATIONAL,
];

export const ALL_PAST_MATCHES: Match[] = [
  ...PAST_MATCHES,
  ...PAST_INTERNATIONAL,
].sort((a, b) => b.startTimeIso.localeCompare(a.startTimeIso));

export const ALL_UPCOMING_MATCHES: Match[] = [
  ...UPCOMING_MATCHES,
  ...UPCOMING_INTERNATIONAL,
].sort((a, b) => a.startTimeIso.localeCompare(b.startTimeIso));

// All competition short-names for filter dropdown
export const ALL_COMPETITION_NAMES: string[] = [
  ...new Set(
    [...ALL_LIVE_MATCHES, ...ALL_PAST_MATCHES, ...ALL_UPCOMING_MATCHES]
      .map(m => m.competition.shortName)
  ),
].sort();
