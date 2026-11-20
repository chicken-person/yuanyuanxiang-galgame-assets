/* ============================================================
 * 全篇事件视频（v3，2026-11-19 13 项修改之第 4 项：视频强制播放）
 * v3 改动（用户 2026-11-19 11:16）：
 *   - 21 处图上热点全部撤掉（热点 JS 与热点矩形一并清理，不留死热点）；
 *     走到该段就直接强制播放，不再靠点图触发。
 *   - 播视频时出字幕：视频层之上盖一层字幕（UI 脚本提供的
 *     window.__yyxSubtitle），与当前卡同文（名牌＋正文）、同字号、居中；
 *     字幕层 pointer-events:none，点按仍走视频层（点视频／跳过按钮跳过）。
 *   - 细节视频（看看 X）走 d01 场景的原生 playVideo：UI 脚本在引子卡的
 *     选项出现时自动点“看看 X”、播完自动点“回到故事”；本文件只负责
 *     原生视频出现时补字幕（字幕文案 = 引子卡原文，由 lastCardKey 取）。
 * 触发点（video → 首播卡；每卡只播一次，重听／重进故事时重置）：
 *   M04：厨房 m04-kitchen.mp4@T01、劳作 m04-work.mp4@T03、盛饭 m04-serving.mp4@T04
 *   G01：炕 g01-kang.mp4@T01、房间 g01-room.mp4@T03
 *   G03：门口 g03-doorway.mp4@T01、风箱 g03-bellows.mp4@T08
 *   G04：火光 g04-fire.mp4@T01、事后 g04-after.mp4@T08
 *   G05：背奶奶 g05-carry.mp4@T01、铁桥 g05-road.mp4@T04、广场 g05-plaza.mp4@T06
 *   M01：年轻妈妈 m01-young-mother.mp4@T01、门口 m01-interior.mp4@T03
 *   M02：双手 m02-hands.mp4@T03（v4：日记 m02-diary.mp4@T01 已去掉，见下）
 *   M03：校舍 m03-schoolhouse.mp4@T01、教室 m03-classroom.mp4@T04
 *   M05：叫到跟前 m05-talk.mp4@T01、夜里学习 m05-study.mp4@T07、翻书 m05-books.mp4@T10
 *   G02 的 3 段（油灯／纺车／窗户）由 g02-video-events.js 负责（同款自动播）。
 * 实现（沿用已实测的视频层）：
 *   视频层为舞台容器 div._MainStage_main 的子元素（position:absolute，
 *   全屏），随舞台一起旋转缩放，手机竖屏也贴合。视频层 z 14，跳过按钮
 *   z 15（层内），字幕层 z 30（UI 脚本挂，与视频层同属舞台）。
 *   播视频时把 #currentBgm / #currentVocal 音量置 0（仿原生
 *   playVideo），并每 100ms 重新压住（React 重渲染会把音量顶回
 *   设定值）；播完 / 跳过 / 失败后恢复（若播期间剧本改了音量，
 *   以剧本为准）。视频失败（error、起播超时）直接撤层，故事不停在当前卡。
 *   React 可能清掉手动挂的子元素，监听器每轮检查并补挂。
 * 原生视频跳过按钮：g02-video-events.js 的 #g02-native-skip 只在
 *   textBox 挂载后才启动，首页没有对白行、首次进入时开场视频等不到它
 *   （2026-11-19 实测 12 秒无按钮）；本文件在舞台出现即启动 tick，
 *   有原生视频且两按钮都不在时补 #fx-native-skip，g02 的按钮一旦出现
 *   就撤掉自己的（见 ensureNativeSkip）。
 *   v3：首页开场视频已改为循环背景（start.txt 不再 playVideo），原生
 *   视频只剩各篇 d01 细节视频；跳过按钮逻辑原样保留。
 * 不改动：剧情文字、插画、名牌、片尾；G02 的视频层与溶解覆盖层不动。
 * ============================================================ */
(function () {
  'use strict';

  // 剧情卡原文（一字未改），用于识别当前卡。键为“篇号-卡号”，值是卡片原文。
  // 匹配用子序列比对（对话文字在 DOM 中每字渲染三份）；多卡命中时取最长者，
  // 避免短句被另一篇的长句误含。
  var CARDS = {
    // ---- M04《屋檐下的厨房》（配音文稿 §M04 主旁白）----
    'M04-T01': '我小时候，家里的厨房不总在一个地方。',
    'M04-T02': '屋檐下、屋后面、走廊上，住处变了，做饭的地方也跟着变。',
    'M04-T03': '可有一件事没怎么变：妈妈白天要上课、改作业，有时还要当班主任，回到家又要张罗一家人的饭。',
    'M04-T04': '锅灶不大，我们姐弟三个却越长越高，胃口也越来越大。妈妈每次都尽量多盛一点。那时的我，最盼的就是开饭。',
    'M04-T05': '我和姐姐、弟弟也在这样的日子里慢慢学会了生活本事。厨房换过地方，许多小事却一直留在记忆里。',
    'M04-T06': '从小学四年级到研究生，这样的日子持续了十多年。妈妈教书、做饭、照顾我们，把一家人的日子一点点过下去。',
    'M04-END': '厨房换过地方，照料一家人的日常却一直在。',
    // ---- 8 篇新故事（脚本 design/scripts/*.md，一字未改；由场景文件机械抽取填入）----
    // ---- G01（脚本 design/scripts/G01.md，一字未改）----
    'G01-T01': '奶奶生于一九一二年。按年纪算，她本该是缠脚的那一辈人。',
    'G01-T02': '可她偏偏没有缠脚，长着一双没有缠过的大脚丫子。',
    'G01-T03': '和她同岁的邻居奶奶们都是小脚，只有她不一样。',
    'G01-T04': '我从小黏着奶奶，下地也好，做饭也好，总挨着她一米以内。',
    'G01-T05': '到了晚上睡觉，我总睡在奶奶脚后头，挨着她的脚丫子。',
    'G01-T06': '睡前我总挠挠她脚心，再替她抠掉脚后跟上的死皮。',
    'G01-T07': '她脚丫子上有一道很醒目的伤疤，我到现在还记得它的样子。',
    'G01-T08': '热乎乎的小身子挨着她睡，把被窝一点点焐热，她心里一定美得很。',
    'G01-T09': '从零岁开始，直到给她送终，我都为这份孝顺感到欣慰。',
    'G01-END': '那床被窝暖过的，不只是一个晚上。',
    'G01-D01-1': '被角掖得严严实实，贴着奶奶的脚后跟，暖烘烘的。',
    'G01-D01-2': '我睡的地方就在奶奶脚后头，被角一掀开，就是她的脚丫子。',
    // ---- G03（脚本 design/scripts/G03.md，一字未改）----
    'G03-T01': '奶奶是个很善良的人。上门来讨一口饭的人，她好像从来没有让人空着手走过。',
    'G03-T02': '那时候家里的日子已经很紧巴了，可她还是愿意把能分出去的一口，分给门外的人。',
    'G03-T03': '要是实在没有剩饭可分，她也会客客气气地请人去别家看看，不让人难堪。',
    'G03-T04': '奶奶一生最怕要饭。她嫁进张家以后，再也没有过那样的日子。',
    'G03-T05': '她管我最严的一句话，是拿要饭来吓唬我，逼着我把该做的事都做好。',
    'G03-T06': '她口中的那些事，都是好孩子该做的：节约粮食、爱惜字纸、认真读书。',
    'G03-T07': '所以直到现在，我都不敢糟蹋粮食，见不得剩饭，宁可吃净，或者打包带走。',
    'G03-T08': '奶奶家还曾短暂收留过一个不知来历的女孩，我放学回家，看见她坐在灶火边拉风箱。',
    'G03-T09': '那时我满心不喜欢她，只觉得自己家里唯一孩子的地位受到了威胁，后来她被送走了，我却松了一口气。',
    'G03-T10': '长大以后我才明白，那双不言不语的眼睛，我欠她一句对不起。',
    'G03-END': '那一口分出去的饭，我到现在还记得它的分量。',
    'G03-D01-1': '那只碗里装的，有时是剩饭，有时是家里紧巴日子里分出来的一口，可奶奶递出去的时候，从不让人空着手走。',
    'G03-D01-2': '如今我见不得剩饭，饭碗见底才安心，这个习惯，是从奶奶那里来的。',
    // ---- G04（脚本 design/scripts/G04.md，一字未改）----
    'G04-T01': '奶奶瘦瘦小小的，单薄的身子底下，却藏着一股不容小觑的力气。',
    'G04-T02': '哪一年起的火，我记不清了，只记得前院那间年久失修的厦房着了火。',
    'G04-T03': '电线叫老鼠啃短了路，火就从那间旧厦房里起来了。',
    'G04-T04': '那像是半夜，我和几个更小的表弟表妹还在后头睡觉。',
    'G04-T05': '救火的场面很吓人，奶奶和姑姑变了脸色，端着水来回灭火，脚步声乱成一团。',
    'G04-T06': '奶奶在村道巷子里声嘶力竭地呼喊，惊醒了邻居，大伙儿都赶来帮忙。',
    'G04-T07': '弟弟妹妹吓得嗷嗷直叫，我的任务就是守着他们，把他们安抚下来。',
    'G04-T08': '火很快就灭了，损失不大，一场不大的火，就这样过去了。',
    'G04-T09': '奶奶的脚背叫落下的碎片灼伤，留下一片我十分熟悉的伤疤。',
    'G04-T10': '事后清点财物才发现，瘦小的奶奶一个人，把一只巨大的衣箱拖到了安全的地方，那重量平常得两个小伙子抬才行。',
    'G04-D01-1': '那只衣箱大得很，平常要两个小伙子一起抬，才抬得动。',
    'G04-D01-2': '可那天夜里，瘦小的奶奶一个人把它拖到了安全的地方，直到事后清点，大伙儿才发现。',
    'G04-END': '人急了，力气会从平时藏着的地方冒出来——奶奶就是这样。',
    // ---- G05（脚本 design/scripts/G05.md，一字未改）----
    'G05-T01': '奶奶一辈子都在为别人忙活，劳碌了一生，直到再也做不动了。',
    'G05-T02': '我是她带大的第一个孙子，后来她又带了一串孙子，甚至孙子的孩子。',
    'G05-T03': '她还能走动的时候，我背着她去看外面的世界，一处一处地看。',
    'G05-T04': '我们去黄河边踩过泥，看铁桥上的火车隆隆地开过去。',
    'G05-T05': '我们去岳庙看过金瓦和铁钟，去咸阳古渡看过飞机起起落落。',
    'G05-T06': '我们还去过雁塔广场，那里人来人往，热闹得摩肩擦踵。',
    'G05-T07': '那一次，她坐在新买的小轿车里，望着窗外，神情里带着感慨。',
    'G05-T08': '她的最后三年，渐渐走不动了，也渐渐认不出眼前的人。',
    'G05-T09': '我大声喊她，她没有应一声，只是眼角滚落了一颗大大的泪珠。',
    'G05-T10': '她走的时候九十六岁，儿孙们伤心，却也知道她终于不用再受苦了。',
    'G05-END': '往后想见她，就只能在梦里见了。',
    // ---- M01（脚本 design/scripts/M01.md，一字未改）----
    'M01-T01': '初中毕业那年，在关中农家，母亲已经算是个有文化的女子了。',
    'M01-T02': '爷爷却认定，念书的日子到头了，该收拾书包，回乡种地去了。',
    'M01-T03': '铁锨、架子车、粪笼、竹扁担；春种菜、夏割麦；时机一到，说门亲事、结个亲家。',
    'M01-T04': '母亲心有不甘，她想再往上读一读，跳出农门，走一条不一样的路。',
    'M01-T05': '奶奶心软心善，是她唯一的突破口；为凑学费，她东家借、西家挪，求爷爷告奶奶。',
    'M01-T06': '她的两个姐姐、两个妹妹、一个弟弟，聪明都不输她，却都没得着机会，走的还是老路。',
    'M01-T07': '有学上就好，其他一切从简，她没选高中再考大学那条长路，时间太长，供不起。',
    'M01-T08': '天南海北的大城市、西安省城都不在选择里，她选了家门口十五公里外的渭南城。',
    'M01-T09': '师范学校供着学费和生活费，读完书，几乎不愁没有工作。',
    'M01-T10': '她考上了一所中等师范学校，大约十八岁的她，为自己开辟了一条新路。',
    'M01-END': '她考上的不只是一所学校，更是一条不同的人生路。',
    'M01-D01-1': '那只书包里，装的是她上学念书的日子，爷爷说，收拾收拾，该回乡种地了。',
    'M01-D01-2': '在她心里，书本不只是几件旧东西，放下书包，就等于放下了读书的念头。',
    // ---- M02（脚本 design/scripts/M02.md，一字未改）----
    'M02-T01': '我还记得，母亲是有写日记的习惯的，那本厚厚的日记本，我到现在还记得它的样子。',
    'M02-T02': '小时候去外婆家，我翻箱倒柜，什么都好奇，家里的角角落落，没有我没翻过的地方。',
    'M02-T03': '母亲在渭南的中等师范学校读过几年书，写起字来端端正正，一笔一划。',
    'M02-T04': '那本日记里，记着母亲的各种故事、各种情怀，还有各种各样的困惑。',
    'M02-T05': '母亲亲口告诉过我，我的生日到底是哪一天，只有那本日记记得最准。',
    'M02-T06': '可是那本日记，后来被爷爷卷成了喇叭筒，卷着自家种的烟叶，烧成了一缕青烟。',
    'M02-T07': '那些字，就这样在青烟里化成了灰，再也找不回来了。',
    'M02-T08': '连我的出生年月日时分秒，也跟着那本日记一起，永远湮灭在烟尘里了。',
    'M02-T09': '爷爷大概只觉得，烟袋锅和喇叭筒之间，不过是换个抽法，没什么大不了。',
    'M02-T10': '由它去吧。留不住的东西，就让它留在烟里，留在我的记忆里。',
    'M02-END': '那本日记烧成了灰，母亲的青春，却留在了我的记忆里。',
    'M02-D01-1': '那本日记很厚，纸页上是一行行端端正正的钢笔字，写得一笔一划。',
    'M02-D01-2': '里面记着母亲的故事和心事，可惜我再也没有机会，亲眼去读一读它了。',
    // ---- M03（脚本 design/scripts/M03.md，一字未改）----
    'M03-T01': '那几年，父母多数时间在扶风教书，调动前后，留出过一段短暂的空窗期。',
    'M03-T02': '母亲留在了村里，暂时在二涨村小学代课；记得父亲调回了村东边的立新中学，短暂任教。',
    'M03-T03': '母亲对我在村里的散漫日子并不满意，可我被爷爷奶奶、姑姑舅舅宠着，过得心满意足。',
    'M03-T04': '那时的村小学很小，只有两个复式班，一年级和三年级一个班，二年级和四年级一个班。',
    'M03-T05': '两个班同在一间教室上课，村里孩子不多，老师和教室都有限，土台子、泥孩子、老房子，就是那时的乡村风景。',
    'M03-T06': '那时村里还没有幼儿园，母亲在村头教书，我在家里散漫游荡。',
    'M03-T07': '谁也没想到，这两件事碰到一块，我就被母亲拎着耳朵，拉进了二涨村小学。',
    'M03-T08': '突然之间，猝不及防，我背上书包，成了一名正规的小学生。',
    'M03-T09': '可我那时只有五岁多，还不到六岁，年龄实在是小了些。',
    'M03-T10': '从那天起，母亲不再只是母亲，也成了我的老师，母子之间，又多了一层师生关系。',
    'M03-END': '从那天起，漫漫求学路，就从村小学那间教室开始了。',
    'M03-D01-1': '原书插图里，母亲带着背书包的我走过教室窗前，窗里几个孩子正探头张望，门外立着一棵大树。',
    'M03-D01-2': '书里没有细写课桌的样子，只写了两个班同在一间教室上课，老师和教室的资源都有限，村里的孩子也不多。',
    // ---- M05（脚本 design/scripts/M05.md，一字未改）----
    'M05-T01': '高一那年开学，我们全家搬进了县城的青山中学。',
    'M05-T02': '母亲调到这所学校，改教地理，父亲也调进了县城。',
    'M05-T03': '搬家的原因，往深里说只有一个：为我上学，为我上大学。',
    'M05-T04': '那几年，高中毕业不是返乡就是下乡，我吃了商品粮，村里没有一寸地，下乡大概躲不开。',
    'M05-T05': '一九七七年的某一天，母亲把我和姐姐叫到跟前。',
    'M05-T06': '她很严肃很严肃，讲了许多当时听不太明白的事。',
    'M05-T07': '好像有个叫高考的东西，考得好能上大学，就不用下乡。',
    'M05-T08': '我年纪太小，只觉得遗憾：不能当知青，去村里疯玩。',
    'M05-T09': '可我是个乖孩子，父母讲的，懂不懂都一字不落地听了进去。',
    'M05-T10': '从那时起，我不再贪玩，天黑了会多学一会儿，像个小大人。',
    'M05-END': '在这一点，我怎么感谢父母，都不为过。',
  };

  // v3 自动播：卡 → 视频（走到该卡就直接播，每卡只播一次；离开剧情后重置）
  var AUTOPLAY = {
    'M04-T01': 'm04-kitchen.mp4',
    'M04-T03': 'm04-work.mp4',
    'M04-T04': 'm04-serving.mp4',
    'G01-T01': 'g01-kang.mp4',
    'G01-T03': 'g01-room.mp4',
    'G03-T01': 'g03-doorway.mp4',
    'G03-T08': 'g03-bellows.mp4',
    'G04-T01': 'g04-fire.mp4',
    'G04-T08': 'g04-after.mp4',
    'G05-T01': 'g05-carry.mp4',
    'G05-T04': 'g05-road.mp4',
    'G05-T06': 'g05-plaza.mp4',
    'M01-T01': 'm01-young-mother.mp4',
    'M01-T03': 'm01-interior.mp4',
    // v4（2026-11-19 第 7 项）：M02-T01 的 m02-diary.mp4 已去掉，不再自动播；
    // M02-D01-1/2 两张文字补充卡保留，细节入口仍进文字卡（见 m02-d01.txt）。
    'M02-T03': 'm02-hands.mp4',
    'M03-T01': 'm03-schoolhouse.mp4',
    'M03-T04': 'm03-classroom.mp4',
    'M05-T01': 'm05-talk.mp4',
    'M05-T07': 'm05-study.mp4',
    'M05-T10': 'm05-books.mp4',
  };

  var NAMEPLATE = '我（成年后的回忆）';
  var activeVideo = null; // 正在播的视频层
  var observedTextNode = null;
  var observer = null;
  var bodyObserver = null;
  var playedCards = {}; // 本次进剧情已自动播过的卡
  var lastCardKey = null; // 最近一次认出的卡（供字幕与自动书签用）
  var nativeSubShown = false; // 原生视频的字幕是否正显示
  var nativeSubKey = null; // 原生视频字幕当前对应的卡（跟随 lastCardKey 补正）

  function norm(s) { return (s || '').replace(/\s+/g, ''); }
  // 子序列匹配：对话文字在 DOM 中每字渲染三份，连续子串匹配会失效
  function seqHas(text, needle) {
    var t = norm(text), n = norm(needle), j = 0;
    for (var i = 0; i < t.length && j < n.length; i++) if (t[i] === n[j]) j++;
    return j === n.length;
  }

  function stage() {
    return document.querySelector('[class*="MainStage_main"]');
  }
  function textBox() {
    return document.getElementById('textBoxMain');
  }
  function currentCard() {
    var tb = textBox();
    if (!tb) return null;
    var txt = tb.textContent || '';
    var best = null, bestLen = 0;
    for (var k in CARDS) {
      if (seqHas(txt, CARDS[k]) && CARDS[k].length > bestLen) { best = k; bestLen = CARDS[k].length; }
    }
    return best;
  }
  function dialogVisible() {
    var tb = textBox();
    if (!tb) return false;
    var cs = window.getComputedStyle(tb);
    if (cs.display === 'none' || cs.visibility === 'hidden') return false;
    var r = tb.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  }
  // 选项是否可见：选项容器本身是 0 高包装层（子元素绝对定位溢出），
  // 须看容器内子元素是否有非零可见尺寸，不能只看容器自身。
  function chooseVisible() {
    var c = document.querySelector('[class*="chooseContainer"]');
    if (!c) return false;
    if (c.classList.contains('yyx-auto-choose')) return true;
    var cs = window.getComputedStyle(c);
    if (cs.display === 'none' || cs.visibility === 'hidden') return false;
    var kids = c.querySelectorAll('*');
    for (var i = 0; i < kids.length; i++) {
      var kcs = window.getComputedStyle(kids[i]);
      if (kcs.display === 'none' || kcs.visibility === 'hidden') continue;
      var r = kids[i].getBoundingClientRect();
      if (r.width > 0 && r.height > 0) return true;
    }
    return false;
  }

  /* ---------- 自动播 ---------- */
  function evaluate() {
    var card = dialogVisible() ? currentCard() : null;
    if (card) {
      lastCardKey = card;
      // 供 UI 脚本的自动书签（第 1 项）读取：上次听到哪篇哪张卡
      window.__yyxCard = { key: card, name: NAMEPLATE, body: CARDS[card] || '' };
    } else {
      // 离开剧情（回目录／标题／结束屏）：清掉已播记录，重听时视频重新播
      playedCards = {};
    }
    if (!card || activeVideo || document.querySelector('#playVideoElement,#fx-video-layer,#g02-video-layer') || chooseVisible()) return;
    var file = AUTOPLAY[card];
    if (file && !playedCards[card]) {
      playedCards[card] = true;
      playVideo(file, card);
    }
  }

  /* ---------- 视频层（仿原生 playVideo 行为） ---------- */
  function duckBgm() {
    var saved = {};
    var bgm = document.getElementById('currentBgm');
    var vocal = document.getElementById('currentVocal');
    if (bgm) { saved.bgm = bgm.volume; bgm.volume = 0; }
    if (vocal) { saved.vocal = vocal.volume; vocal.volume = 0; }
    return saved;
  }
  function restoreBgm(saved) {
    // 只恢复仍被压到 0 的那一路：若播视频期间剧本改了音量（如 T07 降音量），以剧本为准，不覆盖。
    var bgm = document.getElementById('currentBgm');
    var vocal = document.getElementById('currentVocal');
    if (bgm && typeof saved.bgm === 'number' && bgm.volume === 0) { try { bgm.volume = saved.bgm; } catch (e) {} }
    if (vocal && typeof saved.vocal === 'number' && vocal.volume === 0) { try { vocal.volume = saved.vocal; } catch (e) {} }
  }

  function showSubtitle(cardKey) {
    if (window.__yyxSubtitle && cardKey && CARDS[cardKey]) {
      window.__yyxSubtitle.show(NAMEPLATE, CARDS[cardKey]);
    }
  }
  function hideSubtitle() {
    if (window.__yyxSubtitle) window.__yyxSubtitle.hide();
  }

  function playVideo(file, cardKey) {
    if (activeVideo) return;
    var st = stage();
    if (!st) return;
    var saved = duckBgm();
    // 持续压住环境声：React 重渲染会把 <audio> 音量重置回设定值，单次置 0 会被顶回。
    // 引擎还会以约 0.04/s 的速度把音量淡回目标值，100ms 周期可把残余压到 <0.005（基本听不见）。
    var duckTimer = setInterval(function () {
      var b = document.getElementById('currentBgm');
      var v = document.getElementById('currentVocal');
      if (b) { try { b.volume = 0; } catch (e) {} }
      if (v) { try { v.volume = 0; } catch (e) {} }
    }, 100);

    var layer = document.createElement('div');
    layer.id = 'fx-video-layer';
    layer.style.position = 'absolute';
    layer.style.left = '0';
    layer.style.top = '0';
    layer.style.width = '100%';
    layer.style.height = '100%';
    layer.style.zIndex = '14';
    layer.style.background = '#000';
    layer.style.pointerEvents = 'auto';

    var video = document.createElement('video');
    video.id = 'fx-video-element';
    video.src = 'game/video/' + file;
    video.autoplay = true;
    video.playsInline = true;
    video.style.position = 'absolute';
    video.style.left = '0';
    video.style.top = '0';
    video.style.width = '100%';
    video.style.height = '100%';
    video.style.objectFit = 'cover';
    if (typeof saved.bgm === 'number') video.volume = saved.bgm;
    layer.appendChild(video);

    var skip = document.createElement('button');
    skip.id = 'fx-video-skip';
    skip.textContent = '跳过视频 ▸';
    skip.style.cssText = 'position:absolute;right:4%;bottom:5%;z-index:2;min-height:56px;padding:10px 22px;font-size:20px;color:#fff;background:rgba(0,0,0,0.6);border:1px solid rgba(255,255,255,0.6);border-radius:28px;cursor:pointer;';
    layer.appendChild(skip);

    var done = false;
    var watchdog = null;
    function cleanup() {
      if (done) return;
      done = true;
      if (watchdog) clearTimeout(watchdog);
      if (duckTimer) clearInterval(duckTimer);
      try { video.pause(); } catch (e) {}
      try { video.removeAttribute('src'); video.load(); } catch (e) {}
      if (layer.parentNode) layer.parentNode.removeChild(layer);
      restoreBgm(saved);
      hideSubtitle();
      activeVideo = null;
      evaluate();
    }
    video.addEventListener('ended', cleanup);
    video.addEventListener('error', cleanup);
    video.addEventListener('click', function (e) { e.stopPropagation(); e.preventDefault(); cleanup(); });
    skip.addEventListener('click', function (e) { e.stopPropagation(); e.preventDefault(); cleanup(); });
    layer.addEventListener('click', function (e) { e.stopPropagation(); e.preventDefault(); });

    activeVideo = layer;
    st.appendChild(layer);
    // 字幕：当前卡原文（名牌＋正文）盖在视频上当字幕
    showSubtitle(cardKey);

    var started = video.play();
    if (started && typeof started.catch === 'function') started.catch(cleanup);
    // 起播看门狗：12 秒内没播起来就撤层，不卡住故事。
    // （v3 实测：游戏里视频起播要 ~5 秒——媒体取流在剧情场景里比直接播慢，
    // 5 秒看门狗会在首帧到来前误杀；12 秒留足余量。跳过按钮全程可点，
    // 真播不起来用户一点就过，不会被 12 秒困住。）
    watchdog = setTimeout(function () {
      if (!done && (video.readyState === 0 || video.paused)) cleanup();
    }, 12000);
  }

  /* ---------- 原生视频跳过按钮（补 g02-video-events.js 的缺口）+ 原生视频字幕 ---------- */
  // g02-video-events.js 也提供一个（#g02-native-skip），但它的 tick 循环
  // 要等 textBox 出现才启动；首页／目录没有对白行，textBox 永不挂载，
  // 所以开场视频在首次进入时永远等不到它的跳过按钮（2026-11-19 实测：
  // home-opening 播 12 秒全程无按钮、无 textBox）。本文件在舞台出现即
  // 启动 tick，补上这个缺口：有原生视频且两个按钮都不在时建 #fx-native-skip；
  // g02 的按钮一旦出现（进入故事后它的 tick 启动），就撤掉自己的，
  // 保证同一时间只有一个跳过按钮。G02 的文件本身不动。
  // v3：首页开场视频已改为循环背景（start.txt 不再 playVideo），原生
  // 视频只剩各篇 d01 细节视频；跳过按钮逻辑原样保留，并补上字幕
  // （字幕文案 = 引子卡原文，即 lastCardKey 对应的卡）。
  function ensureNativeSkip() {
    var v = document.getElementById('playVideoElement');
    var g02btn = document.getElementById('g02-native-skip');
    var mine = document.getElementById('fx-native-skip');
    if (!v || g02btn) {
      if (mine && mine.parentNode) mine.parentNode.removeChild(mine);
      if (!v && nativeSubShown) { nativeSubShown = false; nativeSubKey = null; hideSubtitle(); }
      return;
    }
    // 原生视频在播：字幕跟随最新认出的卡。引子卡可能比视频晚认出
    // （lastCardKey 还是上一张），认出后补正，避免字幕一直是错的卡。
    if (lastCardKey && lastCardKey !== nativeSubKey) {
      nativeSubKey = lastCardKey;
      nativeSubShown = true;
      showSubtitle(lastCardKey);
    }
    if (mine) return;
    var st = stage();
    if (!st) return;
    var btn = document.createElement('button');
    btn.id = 'fx-native-skip';
    btn.textContent = '跳过视频 ▸';
    btn.style.cssText = 'position:absolute;right:4%;bottom:5%;z-index:15;min-height:56px;padding:10px 22px;font-size:20px;color:#fff;background:rgba(0,0,0,0.6);border:1px solid rgba(255,255,255,0.6);border-radius:28px;cursor:pointer;';
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      e.preventDefault();
      var vv = document.getElementById('playVideoElement');
      if (vv) vv.dispatchEvent(new Event('ended'));
    });
    st.appendChild(btn);
  }

  /* ---------- 监听 ---------- */
  function attachObserver() {
    var tb = textBox();
    if (tb) {
      if (observedTextNode !== tb || !observer) {
        if (observer) { try { observer.disconnect(); } catch (e) {} }
        observedTextNode = tb;
        observer = new MutationObserver(function () { evaluate(); });
        try {
          observer.observe(tb, { childList: true, characterData: true, subtree: true });
        } catch (e) {}
      }
    }
    // body 监听不依赖 textBox：首页没有对白行时也要能补跳过按钮
    if (!bodyObserver) {
      try {
        bodyObserver = new MutationObserver(function () { ensureNativeSkip(); });
        bodyObserver.observe(document.body, { childList: true, subtree: true });
      } catch (e) {}
    }
  }

  function tick() {
    attachObserver();
    evaluate();
    ensureNativeSkip();
  }

  function init() {
    // 只等舞台，不等 textBox：首页／目录没有对白行，textBox 永不挂载；
    // 等它会让整个文件在进故事前一直 dormant（开场视频无跳过按钮即由此来）。
    // tick 内部对 textBox 为空已有容错（evaluate 判定无卡片、热点全藏）。
    // v3：热点已撤，tick 只做自动播与原生视频补位。
    if (!stage()) {
      setTimeout(init, 300);
      return;
    }
    tick();
    setInterval(tick, 300);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
