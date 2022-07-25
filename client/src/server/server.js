const express = require("express");
const app = express();
const port = 3001; // react의 기본값은 3000이니까 3000이 아닌 아무 수
const cors = require("cors");
const bodyParser = require("body-parser");
const mysql = require("mysql"); // mysql 모듈 사용
const dotenv = require("dotenv");
const jwt = require("./jwt-util");
const cookieParser = require("cookie-parser");
dotenv.config({ path: "../../.env" });
// control + c -> 서버 종료 커맨드
// .env 마지막줄에  SECRET_KEY=mySuperSecretKey (JWT관련)추가해주세요~ -규현

// const lightwallet = require("eth-lightwallet");
const Web3 = require("web3");
const web3 = new Web3("http://127.0.0.1:7545");
const TUTabi = require("./contracts/TUTabi");

var connection = mysql.createConnection({
  host: process.env.DATABASE_HOST,
  user: process.env.DATABASE_USERNAME, //mysql의 id
  password: process.env.DATABASE_PASSWORD, //mysql의 password
  database: process.env.DATABASE_NAME, //사용할 데이터베이스
});

connection.connect();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors());
// app.use(cookieParser());

app.post("/", (req, res) => {
  // TODO : server라는 admin 계정 생성시에 ethFacet 처리
  const id = req.body.userName;
  const pwd = req.body.password;
  // 요청 데이터 받음

  if (id === "server") {
    const server = web3.eth.accounts.privateKeyToAccount(
      rows.dataValues.privateKey
    ); //검색한 사용자의 프라이빗키

    const ganache = web3.eth.accounts.privateKeyToAccount(
      env.GANACHE_PRIVATEKEY
    ); //가나슈의 프라이빗키
    //console.log(ganache)
    web3.eth.accounts
      .signTransaction(
        //서명 후 전송처리
        {
          to: server.address,
          value: "1000000000000000000",
          gas: 2000000,
        },
        ganache.privateKey
      )

      .then((value) => {
        console.log("value값", value);
        return value.rawTransaction;
      });
    // .then(aync(tx))={}
    web3.eth.sendSignedTransaction(tx, async function (err, hash) {});
  } else {
    res.status(501).send({ message: "server 계정생성 필요" });
  }
});

app.post("/user/auth", (req, res) => {
  // 인증
  const token = req.headers.authorization.split("Bearer ")[1];
  const result = jwt.verify(token);
  if (result.ok) {
    // token이 검증되었으면 req에 값을 세팅하고, 다음 콜백함수로 갑니다.
    const { id, pwd, nickname } = result;
    res.status(200).send({
      ok: true,
      data: {
        email: id,
        nickname,
      },
    });
  } else {
    // 검증에 실패하거나 토큰이 만료되었다면 클라이언트에게 메세지를 담아서 응답합니다.
    res.status(401).send({
      ok: false,
      message: result.message, // jwt가 만료되었다면 메세지는 'jwt expired'입니다.
    });
  }
});

app.post("/user/login", (req, res) => {
  //로그인
  const id = req.body.id;
  const pwd = req.body.pwd;
  const loginInfo = [id, pwd];
  connection.query(
    "SELECT * FROM users where userName=? and password=?",
    loginInfo,
    function (err, rows, fields) {
      //   console.log("rows = " + rows.length);
      if (rows.length < 1) {
        res.status(400).send({ message: "입력정보가 맞지 않습니다." });
      } else {
        const accessToken = jwt.sign(rows[0]);
        const refreshToken = jwt.refresh();
        //     const payload = {
        //       userName: userInfo.dataValues.userName,
        //       email: userInfo.dataValues.email,
        //       createdAt: userInfo.dataValues.createdAt,
        //       updatedAt: userInfo.dataValues.updatedAt,
        //     }

        //    const value = "10";
        // const erc20Contract = await new web3.eth.Contract(
        //   tokenabi,
        //   process.env.ERC20_CONTRACT,
        //   {
        //     from: process.env.SERVER_ADDRESS,
        //   }
        // );

        // const server = await web3.eth.accounts.wallet.add(process.env.SERVER_SECRET);

        // await erc20Contract.methods.mintToken(userInfo.address, value).send({
        //   from: server.address,
        //   to: process.env.ERC20_CONTRACT,
        //   gasPrice: 100,
        //   gas: 2000000,
        // })

        // await User.increment(
        //   { balance: 1 },
        //   {
        //     where: {
        //       email: req.body.email,
        //     },
        //   }
        // );
        console.log("로그인됨");
        res.status(200).send({
          // client에게 토큰 반환합니다.
          ok: true,
          data: {
            accessToken,
          },
        });
      }
    }
  );
});

app.post("/user/register", (req, res) => {
  // console.log(req.body.regForm.username);
  const id = req.body.regForm.username;
  // json형식의 object에서 각 value만 담아서 배열을 만든다 아래insert ?구문에 들어갈 [ary]배열을 만들기 위함
  const valExtract = req.body.regForm;
  const ary = [];

  for (key in valExtract) {
    ary.push(valExtract[key]);
  }

  connection.query(
    "SELECT * FROM users where userName=? and not userName='server'",
    id,
    function (err, rows, fields) {
      if (err) {
        console.error(err);
      } else {
        if (rows.length < 1) {
          //email을 조회에서 결과가 없다면 insert
          //   address,privateKey 추후에 지갑주소와 니모닉도 넣을때 다음 column들 추가

          let wallet = web3.eth.accounts.create();
          ary.push(wallet.address);
          ary.push(wallet.privateKey);
          console.log("address = " + wallet.address);
          console.log("privateKey = " + wallet.privateKey);
          console.log(ary);
          // console.log(wallet);
          connection.query(
            "INSERT INTO users(userName,password,nickName,address,privateKey) values (?)",
            [ary],
            function (err, rows, fields) {
              if (err) {
                console.log(err);
              } else {
                // let wallet = web3.eth.accounts.create();
                // connection.query(
                //   "INSERT INTO users(address,privateKey) values (wallet.address,wallet.privateKey)",
                //   function (err, rows, fields) {
                //     if (err) {
                //       console.error(err);
                //     } else {
                //       console.log("insert 성공");
                //     }
                //   }
                // );

                console.log("insert 성공");
                res.status(200).send();
              }
            }
          );
        } else {
          //email을 조회해서 결과가 있다면 이미 등록된 아이디
          //   console.log("이미가입된 사용자입니다.");
          res.status(400).send();
        }
      }
    }
  );
});

app.post("/selectCard", (req, res) => {
  connection.query("SELECT * FROM lecture", function (err, rows, fields) {
    if (err) {
      console.log("실패");
    } else {
      if (rows.length < 1) {
        console.log("조회된결과가 하나도 없습니다.");
      } else {
        console.log(rows);
        res.send(rows);
      }
    }
  });
});

app.post("/crawling", (req, res) => {
  //크롤링
  // console.log(req.body.extractEng);
  // console.log(req.body.extractEng[0].word);
  const reqCnt = req.body.extractEng.length;
  let question = "";
  let answer = "";
  let correct = "";

  for (let i = 0; i < reqCnt; i++) {
    question += req.body.extractEng[i].word + "|";
    answer += req.body.extractEng[i].answer + "|";
    correct += req.body.extractEng[i].correct + "|";
    if (i === reqCnt - 1) {
      //마지막 구분자 제거
      question = question.slice(0, -1);
      answer = answer.slice(0, -1);
      correct = correct.slice(0, -1);
    }
  }

  // const valExtract = req.body.regForm;
  let ary = [];

  // for (key in valExtract) {
  //   ary.push(valExtract[key]);
  // }
  ary = [6, answer, question, correct, 5, "e2k"];
  // console.log(ary.toString());

  connection.query(
    "INSERT INTO qz (lec_id,answer,question,correct,qz_num,qz_category) values (?)",
    [ary],
    function (err, rows, fields) {
      if (err) {
        console.log(err);
      } else {
        console.log("qz insert 성공");
        res.status(200).send();
      }
    }
  );
});

app.listen(port, () => {
  console.log(`✅ Connect at http://localhost:${port} 🚀`);
});
