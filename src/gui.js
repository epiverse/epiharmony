import epiHarmonyLogo from '/assets/logo/epiharmony-logo.svg';
import githubLogo from '/assets/logo/github.svg';

function ui(divID) {
  const divUI = divID
    ? document.getElementById(divID)
    : document.createElement('div');

  const sourceCodeUrl = 'https://github.com/epiverse/epiharmony';

  const vocabularyMapperLogo = `
<svg xmlns="http://www.w3.org/2000/svg" 
     width="20" height="20" viewBox="0 0 462 462" 
     class="logo-icon text-gray-500 group-hover:text-gray-600">
  <path fill="currentColor" fill-rule="evenodd" d="
    M231 21c-115.98 0-210 94.02-210 210s94.02 210 210 210 210-94.02 210-210S346.98 21 231 21zm0 30c-99.4 0-180 80.6-180 180s80.6 180 180 180 180-80.6 180-180S330.4 51 231 51zm-95 110h154v-20l36 40-36 40v-20H136v-40zm0 100h154v-20l36 40-36 40v-20H136v-40z
  " stroke="currentColor" stroke-width="20"/>
</svg>
  `;

  const dataTransformLogo = `
<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" 
     viewBox="150 80 700 880" 
     class="logo-icon text-gray-500 group-hover:text-gray-600">
   <path fill="currentColor" fill-rule="evenodd" stroke="currentColor" stroke-width="20" d="
    M709.646851,860.683350 
    C684.220459,877.457886 657.480225,890.620178 628.907104,900.258606 
    C605.175659,908.263855 580.956787,913.965332 556.172791,917.019165 
    C536.183594,919.482239 516.023438,920.430237 495.886536,919.227173 
    C449.254578,916.441284 404.538544,905.624817 362.222076,885.700867 
    C323.297607,867.373962 288.870453,842.606384 258.751526,811.859253 
    C229.932571,782.439087 207.156036,748.853577 189.671295,711.638245 
    C180.879532,692.925415 173.588959,673.578247 168.740402,653.510193 
    C162.812881,628.976440 158.462952,604.190002 157.411301,578.779663 
    C156.519226,557.225464 157.184036,535.800598 159.934189,514.539124 
    C162.553253,494.291138 166.938080,474.274353 173.091324,454.723389 
    C181.266846,428.746979 192.387115,404.075104 206.204071,380.634796 
    C225.544601,347.823792 249.635193,318.936279 278.201691,293.729889 
    C297.500793,276.700836 318.306061,261.821472 340.827942,249.411240 
    C367.604340,234.656601 395.740723,223.272598 425.423828,215.690720 
    C449.063477,209.652496 473.079376,206.341476 497.371979,204.915253 
    C502.606171,204.607941 504.175446,202.491547 504.148071,197.506653 
    C503.997986,170.177719 504.066803,142.847488 504.106506,115.517761 
    C504.109802,113.243141 503.588348,110.849380 505.642639,107.651062 
    C554.114197,150.886185 602.393372,193.949722 651.390991,237.654129 
    C602.428650,281.297882 553.844055,324.604919 505.228119,367.939911 
    C502.817169,365.988342 503.729980,363.653900 503.724792,361.661774 
    C503.652313,333.832184 503.681091,306.002319 503.658051,278.172546 
    C503.652466,271.429352 503.342163,270.944061 496.537933,271.355194 
    C471.373260,272.875946 446.841125,277.559235 422.865570,285.544250 
    C401.741028,292.579773 381.692566,301.825500 362.730225,313.352997 
    C338.566437,328.042542 317.133270,346.058685 298.047516,367.004181 
    C277.211090,389.871033 260.741516,415.533661 247.975601,443.553833 
    C239.133835,462.960815 232.511856,483.178864 228.441360,504.206207 
    C221.627365,539.405823 221.248230,574.748535 226.573608,610.071594 
    C229.573471,629.969604 234.985596,649.384399 242.598648,668.092224 
    C255.244705,699.167664 272.007019,727.750427 294.167755,753.061768 
    C319.111542,781.551819 348.395996,804.369507 382.099915,821.735901 
    C413.416321,837.872070 446.542206,847.545105 481.423706,851.588562 
    C515.157532,855.498962 548.583862,853.238892 581.531738,845.436157 
    C621.259094,836.028015 657.330994,818.604492 689.807556,793.834900 
    C718.019165,772.318298 741.720642,746.594482 760.383728,716.435974 
    C775.589111,691.864990 787.355164,665.752502 794.896118,637.686401 
    C801.121155,614.517761 803.862610,590.985840 804.774170,567.159973 
    C804.944092,562.719177 806.474548,561.521912 810.717346,561.551147 
    C829.212097,561.678711 847.709167,561.558228 866.204468,561.405212 
    C869.209778,561.380371 870.364563,562.398438 870.350281,565.434692 
    C870.264282,583.760498 868.925964,601.944397 865.821594,620.046448 
    C862.496521,639.435364 857.947327,658.454529 851.767578,677.137329 
    C844.681641,698.559570 835.130371,718.838745 824.163147,738.474426 
    C810.139221,763.582397 793.003296,786.451355 773.259399,807.328308 
    C754.212219,827.468689 733.271057,845.408508 709.646851,860.683350 
    M627.053345,666.031006 
    C629.900879,673.557312 632.496216,680.765259 635.381348,687.855225 
    C636.897827,691.581665 636.000122,694.261353 632.928772,696.558411 
    C625.459961,702.144409 617.983643,707.721558 610.584412,713.398682 
    C607.562744,715.717163 604.895935,715.466919 602.031250,713.136353 
    C594.536682,707.039246 586.889221,701.128235 579.456970,694.957214 
    C576.000488,692.087402 572.653625,691.544006 568.409424,693.179688 
    C549.829041,700.340820 554.671997,696.727783 550.367615,714.267334 
    C548.783020,720.724182 547.594055,727.280029 546.302917,733.806213 
    C545.609009,737.313477 543.755066,739.353149 540.086731,739.948853 
    C530.328125,741.533569 520.495605,741.399536 510.668823,741.482361 
    C507.266602,741.511108 506.321350,738.982605 505.447449,736.359497 
    C502.396301,727.201233 499.127655,718.109924 496.322235,708.877625 
    C494.977081,704.450806 492.348083,702.156921 487.967529,701.501770 
    C486.979492,701.354004 485.983765,701.232910 485.010345,701.015442 
    C468.560089,697.342468 473.454834,696.296204 461.175720,708.389771 
    C456.190338,713.299805 451.282928,718.292664 446.454468,723.356995 
    C443.590637,726.360718 440.770569,726.728271 437.142120,724.558228 
    C429.855011,720.199951 422.435944,716.054260 414.975159,711.997742 
    C411.156647,709.921631 409.902008,707.137024 411.030731,702.926025 
    C413.443542,693.924744 415.508057,684.827942 418.032990,675.859741 
    C419.383209,671.064087 418.233948,667.760681 415.117401,663.689087 
    C407.733582,654.042358 399.426422,650.614929 387.682770,655.118958 
    C381.683075,657.419922 375.055878,658.059082 368.744751,659.583618 
    C365.124695,660.458069 362.594086,659.388611 360.890198,656.075500 
    C356.853394,648.226196 352.882812,640.338684 348.642334,632.599915 
    C346.506653,628.702393 347.193909,625.728516 350.322266,622.851746 
    C357.680420,616.085327 364.862335,609.123596 372.326355,602.477661 
    C375.329315,599.803833 376.350281,596.965393 375.256866,593.180481 
    C374.796509,591.586792 374.252350,589.918457 374.288727,588.296265 
    C374.508667,578.485352 368.645538,574.542358 360.094635,572.173401 
    C352.743134,570.136719 345.758667,566.807861 338.516571,564.328857 
    C335.131042,563.169922 333.590820,561.278748 333.967987,557.715271 
    C334.983276,548.123047 335.872467,538.517029 336.950775,528.932129 
    C337.395294,524.981323 340.202026,523.491821 343.841248,522.877075 
    C353.679352,521.215332 363.476379,519.302856 373.329437,517.740540 
    C377.062561,517.148621 379.259552,515.312439 380.669922,511.905243 
    C387.786163,494.713531 387.828186,499.819977 377.600677,485.982910 
    C373.640076,480.624481 369.675446,475.265747 365.568298,470.020142 
    C362.894012,466.604553 362.862274,463.455536 365.606750,460.099976 
    C371.407562,453.007446 377.230347,445.928619 382.843353,438.688538 
    C385.732086,434.962433 388.943817,434.744904 392.963867,436.454041 
    C402.005432,440.298096 411.065887,444.108917 420.217377,447.680267 
    C429.117615,451.153564 440.563812,442.283844 439.766113,432.802826 
    C439.013672,423.860199 438.514008,414.895203 437.680023,405.960876 
    C437.207581,400.899719 438.812195,397.857117 443.988922,396.318878 
    C452.438721,393.808075 460.791718,390.921722 469.047455,387.825592 
    C474.179688,385.900818 477.407318,387.219452 480.350037,391.757568 
    C485.694702,399.999817 491.444885,407.983856 497.161377,415.978729 
    C501.473724,422.009888 514.452332,421.484039 518.048645,415.054260 
    C522.763428,406.624695 527.159912,398.017303 531.710571,389.495575 
    C534.901855,383.519379 536.310608,382.964661 542.890015,384.642456 
    C551.912231,386.943207 560.907959,389.384583 570.009460,391.322021 
    C574.521301,392.282471 576.025818,394.745667 576.133911,398.962341 
    C576.385620,408.782959 576.795654,418.599487 577.133118,428.417969 
    C577.429810,437.053223 587.779968,443.251129 595.359802,439.167969 
    C603.863037,434.587402 612.352417,429.959534 620.627014,424.984894 
    C625.168335,422.254730 628.408569,422.801910 631.965454,426.664337 
    C638.394775,433.645996 645.143127,440.339386 651.885437,447.024872 
    C654.951965,450.065521 655.468201,452.945282 653.101624,456.754425 
    C647.829651,465.240021 642.805115,473.881683 637.789307,482.523376 
    C634.080750,488.912720 639.235352,500.042450 646.685547,500.975555 
    C654.757263,501.986572 662.932251,502.176361 671.063110,502.709381 
    C673.554688,502.872742 676.054260,502.929718 678.541626,503.137360 
    C682.454773,503.464050 684.803650,505.197083 685.582642,509.461975 
    C687.343872,519.105164 689.478455,528.683838 691.636108,538.249207 
    C692.575623,542.414490 690.995972,544.868164 687.342773,546.646179 
    C678.808105,550.799988 670.344971,555.100952 661.858398,559.353333 
    C653.736816,563.422791 652.545776,577.880066 659.871155,583.275208 
    C667.919312,589.202759 675.901367,595.221985 684.022339,601.047852 
    C687.587708,603.605591 688.311523,606.543152 686.756104,610.567322 
    C683.456177,619.104980 680.308289,627.703918 677.251099,636.331909 
    C675.672485,640.787109 673.144165,642.482300 668.165649,641.726135 
    C658.482056,640.255310 648.691162,639.498047 638.952026,638.380859 
    C635.651245,638.002258 633.096680,639.034424 631.193298,641.781311 
    C629.011414,644.930298 626.835022,648.087341 624.529724,651.145508 
    C621.866760,654.678101 623.955200,657.763062 625.217896,660.968384 
    C625.827881,662.516846 626.356201,664.097595 627.053345,666.031006 
    M492.509705,461.034698 
    C491.359802,461.226379 490.191711,461.343719 489.062653,461.620392 
    C436.094727,474.599335 402.415497,525.604858 411.153046,579.382751 
    C420.692627,638.096741 477.049194,676.180969 534.384399,664.349365 
    C589.205444,653.036621 625.482361,598.891846 615.419495,544.032227 
    C604.958679,487.002960 550.013855,449.589813 492.509705,461.034698 
    z
  " />
</svg>
  `;

  const qualityControlLogo = `
<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" 
     viewBox="0 0 980 980" 
     class="logo-icon text-gray-500 group-hover:text-gray-600">
  <path fill="currentColor" d="
    M314.657471,693.968262 
    C313.327423,681.595215 315.493103,669.651306 313.796173,657.649292 
    C309.388336,626.472656 295.244873,600.973389 270.771851,581.272766 
    C254.289734,568.004883 235.218384,560.806030 214.447586,557.237061 
    C185.828354,552.319458 163.436249,530.286011 157.751266,501.527893 
    C151.788589,471.365234 160.890457,446.356689 185.809692,428.175507 
    C208.853973,411.362366 225.640457,390.327667 232.899338,362.580200 
    C240.665009,332.895477 237.865067,304.147614 222.939987,276.982147 
    C216.179260,264.676849 211.242676,251.767029 211.959045,237.546753 
    C214.067841,195.686630 248.400406,165.131714 287.511200,166.830032 
    C297.240997,167.252563 306.417999,170.578903 315.867035,172.481949 
    C352.976837,179.955933 385.865387,170.837814 414.648346,146.646240 
    C429.362732,134.279037 439.641266,118.606049 446.699707,100.814110 
    C457.769318,72.911346 486.356750,57.172234 511.635406,57.417397 
    C544.770691,57.738750 567.483398,72.643631 580.391541,102.643021 
    C598.109436,143.820786 629.375427,167.420761 673.200623,174.274033 
    C689.982544,176.898346 706.659912,174.008652 723.069641,169.489975 
    C772.607727,155.848923 816.288147,196.447922 814.192566,243.016144 
    C813.664917,254.741928 809.865967,265.525757 804.208923,275.687622 
    C793.673218,294.613129 788.233154,314.876556 789.403015,336.515320 
    C791.313171,371.843262 805.892944,400.971558 833.832642,422.975311 
    C841.957703,429.374176 850.513977,435.218689 856.639832,443.754974 
    C888.674011,488.394165 862.667725,549.691528 808.099365,558.199829 
    C758.185791,565.982300 719.506104,606.125732 712.933960,656.633789 
    C711.740845,665.803162 711.908386,674.944641 712.278748,684.067017 
    C713.811890,721.829773 683.145569,752.145020 649.548767,756.505371 
    C626.991272,759.432983 607.788635,752.970581 591.091370,738.122681 
    C578.984253,727.356628 565.618530,718.668884 550.118225,713.835144 
    C508.173157,700.754578 470.134857,707.981201 436.816833,736.969971 
    C423.151611,748.859497 407.956207,756.656921 389.666260,757.281128 
    C351.748779,758.575378 318.498291,730.490295 314.657471,693.968262 
    M670.533630,248.972244 
    C665.555664,244.800262 660.740784,240.413635 655.574707,236.489273 
    C600.061890,194.319397 537.595398,179.790833 469.395050,192.035507 
    C418.266693,201.215057 375.121918,226.086868 340.204346,264.658173 
    C304.916382,303.638580 284.943176,349.601776 280.526825,401.891388 
    C277.782318,434.386261 281.635834,466.349945 292.542694,497.345062 
    C307.656219,540.294922 332.901428,576.025208 368.599274,604.157654 
    C407.236664,634.606567 451.083374,651.537964 500.465576,654.124451 
    C528.745605,655.605652 556.312012,652.359497 583.215332,643.831116 
    C625.198364,630.522461 660.683716,607.159790 689.517151,573.825500 
    C727.611023,529.785156 746.274109,478.346527 746.554688,420.383362 
    C746.672607,396.009216 742.931702,371.986450 735.160522,348.689575 
    C722.284668,310.089722 700.897827,277.058838 670.533630,248.972244 
    z
    
    M783.466553,905.687744 
    C773.491455,905.269043 764.643555,901.628845 755.494019,899.270447 
    C743.447876,896.165527 731.722900,891.521545 718.956055,891.955078 
    C698.608826,892.645996 683.125122,901.820190 673.347595,919.489868 
    C666.020874,932.730591 659.864258,946.621216 653.257263,960.256592 
    C650.718445,965.496277 647.576904,969.478821 640.931091,969.407898 
    C634.243347,969.336487 631.268738,965.170105 628.884766,959.895325 
    C598.784729,893.297668 568.659424,826.711426 538.598572,760.096130 
    C537.690796,758.084534 535.996582,756.159424 536.759705,753.603088 
    C538.744507,752.353271 540.346619,753.692200 541.970337,754.272522 
    C552.521484,758.043640 561.201599,764.709900 569.545105,771.974365 
    C590.925781,790.589966 616.072937,800.129700 644.199158,799.388855 
    C676.834229,798.529358 704.982117,786.049438 727.607361,762.027466 
    C728.955200,760.596436 730.053406,758.832397 732.421753,758.106628 
    C735.782593,760.514648 736.520752,764.656189 738.098816,768.133545 
    C756.192871,808.005005 774.167053,847.930969 792.116150,887.867981 
    C795.901428,896.290222 792.718933,902.926819 783.466553,905.687744 
    z
    
    M379.418915,968.084473 
    C375.267487,965.557068 373.789978,961.574402 371.971008,957.844849 
    C365.984222,945.569946 360.360413,933.103516 353.968750,921.043640 
    C341.403473,897.335327 316.472931,886.873108 290.437378,893.930847 
    C276.941772,897.589233 263.494781,901.430481 249.970093,904.976562 
    C241.308029,907.247742 235.057022,903.871338 233.080841,896.403076 
    C232.152924,892.896362 233.360321,889.811951 234.729126,886.768066 
    C244.223679,865.654907 253.750336,844.556213 263.282196,823.459900 
    C272.403473,803.272217 281.538544,783.090698 290.683716,762.913879 
    C291.484161,761.147827 291.846680,759.036072 294.052521,758.168213 
    C296.363586,758.709045 297.445068,760.746277 298.882599,762.268555 
    C317.776489,782.276123 341.042450,794.446960 368.029724,798.345459 
    C401.896423,803.237793 431.951874,793.397095 457.908325,771.255493 
    C465.823761,764.503418 473.961487,758.251465 483.744598,754.478088 
    C485.523438,753.791992 487.296570,752.548584 489.446869,753.414307 
    C490.596832,755.426025 489.187256,756.944641 488.477509,758.517395 
    C458.334534,825.309814 428.161987,892.088928 398.011688,958.877991 
    C393.607697,968.633728 388.591858,971.261902 379.418915,968.084473 
    z
    
    M543.058228,451.528473 
    C555.697510,442.277985 568.355286,433.052704 580.970154,423.769135 
    C591.167603,416.264648 601.558594,408.994263 611.408752,401.055511 
    C620.206909,393.964569 621.429810,381.473969 614.983582,372.736115 
    C607.814026,363.017792 594.921021,361.230255 584.363586,368.890198 
    C552.539795,391.979980 520.780701,415.159729 489.118042,438.469635 
    C485.398376,441.208038 483.460571,441.035675 480.889221,437.114502 
    C474.952820,428.061829 468.636566,419.254395 462.349731,410.436371 
    C454.522278,399.457306 441.738586,396.979797 431.298248,404.283173 
    C421.864288,410.882477 420.079041,423.698578 427.457184,434.416901 
    C438.888519,451.023285 450.554871,467.467896 462.111420,483.988159 
    C464.913147,487.993317 468.826416,490.366486 473.394379,491.808807 
    C481.344543,494.319031 488.075439,491.636047 494.416260,486.994781 
    C510.416016,475.283630 526.454895,463.626038 543.058228,451.528473 
    Z
  "/>
  
  <path fill="none" stroke="currentColor" stroke-width="25" d="
    M575.728394,601.848267 
    C501.678772,624.739441 435.986420,610.545898 379.711731,557.788818 
    C348.314148,528.353821 330.041565,491.139252 323.945221,448.547913 
    C312.205902,366.532837 354.105560,286.690979 427.873871,250.108078 
    C466.068024,231.166977 506.289459,225.737671 548.406372,233.347855 
    C624.516663,247.100311 686.384460,307.606659 700.530640,383.924194 
    C713.773560,455.368439 692.457581,516.162170 638.695190,565.208008 
    C620.505981,581.801514 599.386658,593.697937 575.728394,601.848267 
    M543.058228,451.528473 
    C555.697510,442.277985 568.355286,433.052704 580.970154,423.769135 
    C591.167603,416.264648 601.558594,408.994263 611.408752,401.055511 
    C620.206909,393.964569 621.429810,381.473969 614.983582,372.736115 
    C607.814026,363.017792 594.921021,361.230255 584.363586,368.890198 
    C552.539795,391.979980 520.780701,415.159729 489.118042,438.469635 
    C485.398376,441.208038 483.460571,441.035675 480.889221,437.114502 
    C474.952820,428.061829 468.636566,419.254395 462.349731,410.436371 
    C454.522278,399.457306 441.738586,396.979797 431.298248,404.283173 
    C421.864288,410.882477 420.079041,423.698578 427.457184,434.416901 
    C438.888519,451.023285 450.554871,467.467896 462.111420,483.988159 
    C464.913147,487.993317 468.826416,490.366486 473.394379,491.808807 
    C481.344543,494.319031 488.075439,491.636047 494.416260,486.994781 
    C510.416016,475.283630 526.454895,463.626038 543.058228,451.528473 
    z
  "/>
</svg>
  `;

  divUI.innerHTML = `
<!-- Header -->
<div id="header" class="w-full px-6 sm:px-10 bg-orange-900 rounded-b-lg border-3 border-orange-950">
  <div class="flex items-center justify-between">
    <div class="flex items-center justify-start">
      <div class="flex items-center">
        <img src="${epiHarmonyLogo}" class="h-10 w-10 sm:h-20 sm:w-20 logo vanilla" alt="epiHarmony logo" />
      </div>
      <div class="min-w-0 px-4 sm:px-6">
        <h2 class="text-2xl font-bold leading-7 text-white sm:text-5xl sm:tracking-tight"
            style="font-family: 'Dancing Script', cursive;">
          epiHarmony
        </h2>
      </div>
    </div>
    <div class="flex md:mt-0 md:ml-4 shrink-0">
      <a title="Source code" target="_blank" href="${sourceCodeUrl}">
        <img src="${githubLogo}" class="h-8 w-8 sm:h-14 sm:w-14 fill-current" alt="github logo" />
      </a>
    </div>
  </div>
</div>

<!-- App Configuration -->
<div id="app-config-section" class="px-6 sm:px-10 bg-gray-50 border-b border-gray-200">
  <div id="config-header" class="flex items-center justify-between py-4">
    <h3 class="text-xl font-bold text-gray-700">epiHarmony Configuration</h3>
    <!-- Toggle button show/hide panel -->
    <button id="toggle-config" 
            class="text-gray-700 bg-white px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-100 
                   cursor-pointer transition-colors" 
            aria-expanded="true">
      Hide configuration panel
    </button>
  </div>
  <!-- Config panel content -->
  <div id="config-content" class="pb-4 px-4 border-t border-gray-200">
    <!-- Blueprint File -->
    <div class="mt-4">
      <h4 class="text-md font-semibold text-gray-800 mb-1">epiHarmony Blueprint File</h4>
      <p class="text-sm text-gray-600 mb-2">[Placeholder short text description for blueprint file]</p>
      <div class="flex flex-col sm:flex-row items-start sm:items-end gap-4">
        <div class="flex flex-col">
          <label for="blueprint-url" class="text-sm text-gray-700 mb-1">Enter JSON file URL:</label>
          <input id="blueprint-url" type="text"
                 class="block w-full border border-gray-300 rounded px-2 py-1 text-gray-900
                        focus:outline-none focus:ring-2 focus:ring-amber-600 focus:border-transparent 
                        cursor-text" 
                 placeholder="https://example.com/blueprint.json" />
        </div>
        <div class="flex flex-col">
          <label for="blueprint-file" class="text-sm text-gray-700 mb-1">Or upload JSON file:</label>
          <input id="blueprint-file" type="file" accept=".json"
                 class="cursor-pointer text-sm text-gray-900 file:mr-4 file:py-2 file:px-4
                        file:rounded file:border-0 file:text-sm file:font-semibold
                        file:bg-gray-200 hover:file:bg-gray-300" />
        </div>
      </div>
      <div id="blueprint-message" class="mt-3 hidden"></div>
      <div id="blueprint-error-container" class="hidden mt-2"></div>
    </div>

    <hr class="my-4"/>

    <!-- LLM API Configuration -->
    <div>
      <h4 class="text-md font-semibold text-gray-800 mb-1">LLM API Configuration</h4>
      <p class="mt-1 text-sm leading-6 text-gray-600">Provide the base URL of your LLM API endpoint and the associated API key. The endpoint must be compatible with OpenAI's API structure, requiring the <a target="_blank" class="underline text-amber-700 text-sm font-mono" href="https://platform.openai.com/docs/api-reference/models">models</a> and <a target="_blank" class="underline text-amber-700 text-sm font-mono" href="https://platform.openai.com/docs/api-reference/chat/create">chat/completions</a> endpoints. For example, to use the OpenAI API, set the base URL to <span class="font-mono px-1 rounded">https://api.openai.com/v1</span> and the API key can be generated at <a target="_blank" class="underline text-amber-700 text-sm" href="https://platform.openai.com/api-keys">OpenAI API keys</a>. Optionally, an LLM can be self-hosted via an OpenAI-compatible API using tools like <a target="_blank" class="underline text-amber-700 text-sm" href="https://docs.vllm.ai/en/latest/serving/openai_compatible_server.html">vLLM</a>.</p>

      <div class="flex flex-col sm:flex-row gap-4">
        <div class="flex-1">
          <label for="llm-base-url" class="text-sm font-medium text-gray-700 mb-1 block">Base URL:</label>
          <input id="llm-base-url" type="text" value="https://api.openai.com/v1"
                 class="w-full border border-gray-300 rounded px-2 py-1 text-gray-900
                        focus:outline-none focus:ring-2 focus:ring-amber-600 focus:border-transparent 
                        cursor-text" />
        </div>
        <div class="flex-1">
          <label for="llm-api-key" class="text-sm font-medium text-gray-700 mb-1 block">API key:</label>
          <input id="llm-api-key" type="password"
                 class="w-full border border-gray-300 rounded px-2 py-1 text-gray-900
                        focus:outline-none focus:ring-2 focus:ring-amber-600 focus:border-transparent 
                        cursor-text" />
        </div>
      </div>

      <div class="mt-3 flex gap-2">
        <button id="submit-api-key-btn"
                class="bg-amber-800 text-white px-4 py-2 rounded-md hover:bg-amber-700 cursor-pointer">
          Submit API key
        </button>
        <button id="reset-api-key-btn"
                class="bg-white text-gray-700 border border-gray-300 px-4 py-2 rounded-md hover:bg-gray-50 cursor-pointer">
          Reset all
        </button>
      </div>
      <div id="llm-api-key-message" class="mt-3 hidden"></div>
    </div>

    <hr class="my-4"/>

    <!-- Model selection -->
    <div>
      <h4 class="text-md font-semibold text-gray-800 mb-1">Model Selection</h4>
      <p class="mt-1 text-sm leading-6 text-gray-600">Select a model from the list below that is available at your chosen API endpoint.</p>

      <div class="flex flex-col sm:flex-row gap-4">
        <div class="flex-1">
          <label for="embedding-model-select" class="text-sm font-medium text-gray-700 mb-1 block">Embedding model:</label>
          <select id="embedding-model-select"
                  class="w-full border border-gray-300 rounded px-2 py-1 text-gray-900 
                         focus:outline-none focus:ring-2 focus:ring-amber-600 focus:border-transparent 
                         cursor-pointer">
            <option value="" disabled selected>Set URL/API key above to see models list</option>
          </select>
        </div>
        <div class="flex-1">
          <label for="chat-model-select" class="text-sm font-medium text-gray-700 mb-1 block">Chat model:</label>
          <select id="chat-model-select"
                  class="w-full border border-gray-300 rounded px-2 py-1 text-gray-900
                         focus:outline-none focus:ring-2 focus:ring-amber-600 focus:border-transparent
                         cursor-pointer">
            <option value="" disabled selected>Set URL/API key above to see models list</option>
          </select>
        </div>
      </div>
    </div>

    <hr class="my-4"/>

    <!-- Upload schemas -->
    <div>
      <h4 class="text-md font-semibold text-gray-800 mb-1">Upload Schemas</h4>
      <p class="text-sm text-gray-600 mb-2">[Placeholder description for Source schema and Target schema]</p>

      <div class="flex flex-col sm:flex-row gap-4">
        <div class="flex-1">
          <label for="source-schema-url" class="text-sm font-medium text-gray-700 mb-1 block">Source schema (JSON Schema):</label>
          <input id="source-schema-url" type="text"
                 class="w-full border border-gray-300 rounded px-2 py-1 text-gray-900
                        focus:outline-none focus:ring-2 focus:ring-amber-600 focus:border-transparent
                        cursor-text"
                 placeholder="https://example.com/source-schema.json"/>
        </div>
        <div class="flex-1">
          <label for="target-schema-url" class="text-sm font-medium text-gray-700 mb-1 block">Target schema (JSON Schema):</label>
          <input id="target-schema-url" type="text"
                 class="w-full border border-gray-300 rounded px-2 py-1 text-gray-900
                        focus:outline-none focus:ring-2 focus:ring-amber-600 focus:border-transparent
                        cursor-text"
                 placeholder="https://example.com/target-schema.json"/>
        </div>
      </div>

      <div id="schemas-message" class="mt-3 hidden"></div>
    </div>

    <hr class="my-4"/>

    <!-- Upload data -->
    <div>
      <h4 class="text-md font-semibold text-gray-800 mb-1">Upload Data</h4>
      <p class="text-sm text-gray-600 mb-2">[Placeholder description for Source dataset]</p>
      <label for="target-schema-url" class="text-sm font-medium text-gray-700 mb-1 block">Source data (JSON):</label>
      <input id="target-dataset" type="file" accept=".json"
             class="cursor-pointer text-sm text-gray-900 file:mr-4 file:py-2 file:px-4
                    file:rounded file:border-0 file:text-sm file:font-semibold
                    file:bg-gray-200 hover:file:bg-gray-300" />

      <div id="dataset-message" class="mt-3 hidden"></div>
    </div>

    <!-- Configuration panel Submit / Reset buttons -->
    <div class="mt-6 flex gap-2 justify-end">
      <button id="configure-epiharmony-btn"
              class="bg-amber-800 text-white px-4 py-2 rounded-md hover:bg-amber-700 cursor-pointer">
        Configure epiHarmony
      </button>
      <button id="reset-all-btn"
              class="bg-white text-gray-700 border border-gray-300 px-4 py-2 rounded-md hover:bg-gray-50 cursor-pointer">
        Reset all
      </button>
    </div>
  </div>
</div>

<!-- Navigation tabs -->
<div>
  <!-- Dropdown (mobile users) -->
  <div class="grid grid-cols-1 sm:hidden">
    <select id="nav-select"
            aria-label="Select a tab"
            class="col-start-1 row-start-1 w-full appearance-none rounded-md bg-white py-2 pr-8 pl-3 text-base text-gray-900
                   outline-1 -outline-offset-1 outline-gray-300
                   focus:outline-2 focus:-outline-offset-2 focus:outline-amber-600">
      <option data-tabname="Vocabulary Mapper" selected>Vocabulary Mapper</option>
      <option data-tabname="Data Transform">Data Transform</option>
      <option data-tabname="Quality Control">Quality Control</option>
    </select>
    <svg class="pointer-events-none col-start-1 row-start-1 mr-2 size-5 self-center justify-self-end fill-gray-500"
         viewBox="0 0 16 16" fill="currentColor" aria-hidden="true" data-slot="icon">
      <path fill-rule="evenodd" d="M4.22 6.22a.75.75 0 0 1 1.06 0L8 8.94l2.72-2.72a.75.75 0 1 1 1.06 1.06l-3.25 3.25a.75.75 0 0 1-1.06 0L4.22 7.28a.75.75 0 0 1 0-1.06Z" clip-rule="evenodd" />
    </svg>
  </div>

  <!-- Tabs (desktop users) -->
  <div class="hidden sm:block">
    <div class="border-b border-gray-200">
      <nav class="-mb-px flex space-x-8" aria-label="Tabs">
        <!-- Vocabulary Mapper -->
        <a href="#"
           class="tab-link group inline-flex items-center border-b-3 border-amber-500 px-4 py-3 text-lg font-medium text-amber-600"
           data-tabname="Vocabulary Mapper"
           aria-current="page">
          ${vocabularyMapperLogo.replace('text-gray-500 group-hover:text-gray-600', 'text-amber-600')}
          <span class="pl-2">Vocabulary Mapper</span>
        </a>

        <!-- Data Transform -->
        <a href="#"
           class="tab-link group inline-flex items-center border-b-3 border-transparent px-4 py-3 text-lg font-medium text-gray-500 hover:border-gray-300 hover:text-gray-600"
           data-tabname="Data Transform">
          ${dataTransformLogo}
          <span class="pl-2">Data Transform</span>
        </a>

        <!-- Quality Control -->
        <a href="#"
           class="tab-link group inline-flex items-center border-b-3 border-transparent px-4 py-3 text-lg font-medium text-gray-500 hover:border-gray-300 hover:text-gray-600"
           data-tabname="Quality Control">
          ${qualityControlLogo}
          <span class="pl-2">Quality Control</span>
        </a>
      </nav>
    </div>
  </div>
</div>

<!-- Main stage -->
<div id="main" class="p-6 text-gray-800 text-lg">
  <!-- Vocabulary Mapper app -->
  <div id="vocabulary-mapper-app" class="tab-content">
    <p>Vocabulary Mapper app here.</p>
  </div>
  
  <!-- Data Transform app -->
  <div id="data-transform-app" class="tab-content hidden">
    <p>Data Transform app here.</p>
  </div>
  
  <!-- Quality Control app -->
  <div id="quality-control-app" class="tab-content hidden">
    <p>Quality Control app here.</p>
  </div>
</div>
  `;

  return divUI;
}

export { ui };
