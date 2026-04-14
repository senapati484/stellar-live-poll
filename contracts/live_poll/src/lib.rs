#![no_std]
use soroban_sdk::{contract, contractimpl, symbol_short, Env, Map, String, Symbol, Vec};

const QUESTION: Symbol = symbol_short!("QUESTION");
const VOTES: Symbol = symbol_short!("VOTES");

#[contract]
pub struct LivePoll;

#[contractimpl]
impl LivePoll {
    pub fn set_question(env: Env, question: String) {
        env.storage().persistent().set(&QUESTION, &question);
        env.storage().persistent().set(&VOTES, &Map::<String, u32>::new(&env));
    }

    pub fn get_question(env: Env) -> String {
        env.storage()
            .persistent()
            .get(&QUESTION)
            .unwrap_or_else(|| String::from_str(&env, ""))
    }

    pub fn vote(env: Env, option: String) {
        let mut votes: Map<String, u32> = env
            .storage()
            .persistent()
            .get(&VOTES)
            .unwrap_or_else(|| Map::new(&env));

        let count = votes.get(option.clone()).unwrap_or(0);
        votes.set(option.clone(), count + 1);
        env.storage().persistent().set(&VOTES, &votes);

        env.events().publish((symbol_short!("vote"), option), count + 1);
    }

    pub fn get_results(env: Env) -> Vec<(String, u32)> {
        let votes: Map<String, u32> = env
            .storage()
            .persistent()
            .get(&VOTES)
            .unwrap_or_else(|| Map::new(&env));

        let mut results: Vec<(String, u32)> = Vec::new(&env);
        for item in votes.iter() {
            results.push_back(item);
        }

        // Return without sorting (we'll sort in the frontend)
        results
    }
}
