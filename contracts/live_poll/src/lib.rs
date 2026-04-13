#![no_std]
use soroban_sdk::{contract, contractimpl, symbol_short, Env, Map, Symbol, Vec};

const QUESTION: Symbol = symbol_short!("QUESTION");
const VOTES: Symbol = symbol_short!("VOTES");

#[contract]
pub struct LivePoll;

#[contractimpl]
impl LivePoll {
    pub fn set_question(env: Env, question: String) {
        env.storage().persistent().set(&QUESTION, &question);
        env.storage().persistent().set(&VOTES, &Map::<Env, String, u32>::new(&env));
    }

    pub fn get_question(env: Env) -> String {
        env.storage()
            .persistent()
            .get(&QUESTION)
            .unwrap_or(Ok(String::from_val(&env, &soroban_sdk::Bytes::new(&env))))
            .unwrap()
    }

    pub fn vote(env: Env, option: String) {
        let mut votes: Map<Env, String, u32> = env
            .storage()
            .persistent()
            .get(&VOTES)
            .unwrap_or(Ok(Map::new(&env)))
            .unwrap();

        let count = votes.get(option.clone()).unwrap_or(Ok(0)).unwrap();
        votes.set(option.clone(), count + 1);
        env.storage().persistent().set(&VOTES, &votes);

        env.events().publish((symbol_short!("vote"), option), count + 1);
    }

    pub fn get_results(env: Env) -> Vec<(String, u32)> {
        let votes: Map<Env, String, u32> = env
            .storage()
            .persistent()
            .get(&VOTES)
            .unwrap_or(Ok(Map::new(&env)))
            .unwrap();

        let mut results: Vec<(String, u32)> = Vec::new(&env);
        for (option, count) in votes.iter() {
            results.push_back((option, count));
        }

        results.sort(|a, b| b.1.cmp(&a.1));
        results
    }
}
